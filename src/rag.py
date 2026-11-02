import os
import time
import traceback
import threading
from typing import Optional, List, Dict, Any

from groq import Groq
from src.retrieval import search_similar_chunks


# --------------------------------------------------
# 1. MODEL CONFIGURATION
# --------------------------------------------------

# Primary verified Groq models for research QA
DEFAULT_GROQ_MODEL = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")
FALLBACK_GROQ_MODELS = ["openai/gpt-oss-20b", "allam-2-7b"]

DEFAULT_MAX_NEW_TOKENS = int(os.getenv("MAX_NEW_TOKENS", "700"))
LOCAL_MODEL_ID = "LiquidAI/LFM2.5-1.2B-Instruct"

_groq_client = None
_client_lock = threading.Lock()

_local_model = None
_local_tokenizer = None
_local_lock = threading.Lock()


# --------------------------------------------------
# 2. CLIENT AND MODEL LOADERS
# --------------------------------------------------

def get_groq_client() -> Optional[Groq]:
    """Create and cache the Groq client thread-safely."""
    global _groq_client
    if _groq_client is not None:
        return _groq_client

    with _client_lock:
        if _groq_client is None:
            api_key = os.getenv("GROQ_API_KEY")
            if not api_key or not api_key.strip():
                print("[RAG Warning] GROQ_API_KEY is not configured.", flush=True)
                return None
            try:
                _groq_client = Groq(api_key=api_key.strip())
            except Exception as e:
                print(f"[RAG Warning] Failed to initialize Groq client: {e}", flush=True)
                return None

    return _groq_client


def get_local_llm():
    """Lazily load the local LiquidAI LFM2.5-1.2B-Instruct model on CPU as fallback."""
    global _local_model, _local_tokenizer
    if _local_model is not None and _local_tokenizer is not None:
        return _local_model, _local_tokenizer

    with _local_lock:
        if _local_model is None or _local_tokenizer is None:
            import torch
            from transformers import AutoTokenizer, AutoModelForCausalLM

            print(f"[RAG Local LLM] Initializing local fallback model ({LOCAL_MODEL_ID})...", flush=True)
            t0 = time.time()
            try:
                tokenizer = AutoTokenizer.from_pretrained(LOCAL_MODEL_ID, local_files_only=True)
                model = AutoModelForCausalLM.from_pretrained(
                    LOCAL_MODEL_ID,
                    torch_dtype=torch.float32,
                    local_files_only=True
                )
            except Exception:
                tokenizer = AutoTokenizer.from_pretrained(LOCAL_MODEL_ID)
                model = AutoModelForCausalLM.from_pretrained(
                    LOCAL_MODEL_ID,
                    torch_dtype=torch.float32
                )
            _local_tokenizer = tokenizer
            _local_model = model
            print(f"[RAG Local LLM] Local model loaded in {time.time() - t0:.2f}s.", flush=True)

    return _local_model, _local_tokenizer


# --------------------------------------------------
# 3. CONTEXT CONSTRUCTION
# --------------------------------------------------

def construct_context(chunks: List[Dict[str, Any]], max_chunk_chars: int = 1500) -> str:
    """Format retrieved paper chunks into structured context blocks for the LLM."""
    context_blocks = []

    for idx, chunk in enumerate(chunks, start=1):
        clean_text = chunk["text"].strip().replace("\r\n", "\n")
        if len(clean_text) > max_chunk_chars:
            clean_text = clean_text[:max_chunk_chars].rstrip() + "..."

        block = (
            f"[Passage {idx} | Paper: \"{chunk['title']}\" | Page: {chunk['page']}]\n"
            f"{clean_text}"
        )
        context_blocks.append(block)

    return "\n\n".join(context_blocks)


# --------------------------------------------------
# 4. LOCAL GENERATION FALLBACK
# --------------------------------------------------

def generate_local_answer(context_str: str, question: str, max_tokens: int = 350) -> str:
    """Infers answer using the local LiquidAI LFM2.5-1.2B-Instruct model on CPU."""
    import torch
    model, tokenizer = get_local_llm()

    system_text = (
        "You are an expert AI research assistant. Provide an accurate, grounded answer "
        "to the question based strictly on the provided research context. Cite paper and page numbers."
    )
    user_text = f"Context:\n{context_str}\n\nQuestion: {question}\n\nAnswer:"

    messages = [
        {"role": "system", "content": system_text},
        {"role": "user", "content": user_text}
    ]

    prompt = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    inputs = tokenizer(prompt, return_tensors="pt")

    with torch.no_grad():
        output_ids = model.generate(
            **inputs,
            max_new_tokens=max_tokens,
            do_sample=False,
            pad_token_id=tokenizer.eos_token_id
        )

    new_tokens = output_ids[0][inputs["input_ids"].shape[1]:]
    return tokenizer.decode(new_tokens, skip_special_tokens=True).strip()


# --------------------------------------------------
# 5. MAIN RAG ANSWER PIPELINE
# --------------------------------------------------

def generate_rag_answer(
    question: str,
    top_k: int = 3,
    paper_id: Optional[int] = None,
    max_new_tokens: Optional[int] = None
) -> Dict[str, Any]:
    """
    Executes the grounded RAG question-answering workflow:
    1. Query embedding and similarity search via pgvector.
    2. Context verification and similarity threshold validation.
    3. Multi-tier LLM generation (Primary: Groq Cloud; Secondary: Local LiquidAI).
    4. Citations grounding and structured error reporting.
    """
    total_start_time = time.perf_counter()

    # Normalize question
    clean_question = (question or "").strip()
    if not clean_question:
        return {
            "question": "",
            "answer": "Please provide a valid question about the research paper.",
            "sources": [],
            "status": "insufficient_context",
            "model": None
        }

    gen_tokens_limit = max_new_tokens if max_new_tokens is not None else DEFAULT_MAX_NEW_TOKENS
    gen_tokens_limit = max(50, min(gen_tokens_limit, 1000))

    # STEP 1: RETRIEVE RELEVANT CHUNKS
    t_retrieval_start = time.perf_counter()
    chunks = search_similar_chunks(
        clean_question,
        top_k=max(top_k, 3),
        paper_id=paper_id
    )
    retrieval_elapsed = time.perf_counter() - t_retrieval_start

    # STEP 2: PREPARE CITATION SOURCES
    sources = []
    seen_chunks = set()

    for chunk in chunks:
        cid = chunk.get("chunk_id")
        if cid is not None and cid in seen_chunks:
            continue
        if cid is not None:
            seen_chunks.add(cid)

        sources.append({
            "paper": chunk["title"],
            "page": chunk["page"],
            "similarity": round(float(chunk["similarity"]), 4),
            "text": chunk.get("text", "").strip(),
            "chunk_id": cid
        })

    # STEP 3: CHECK RETRIEVAL QUALITY THRESHOLD
    similarity_threshold = 0.50 if paper_id is not None else 0.52
    if not chunks or chunks[0]["similarity"] < similarity_threshold:
        paper_context_str = f" in paper ID {paper_id}" if paper_id else ""
        print(
            f"[RAG Notice] Retrieval similarity ({chunks[0]['similarity'] if chunks else 0.0:.4f}) "
            f"below threshold ({similarity_threshold}){paper_context_str}. Returning insufficient context notice.",
            flush=True
        )
        return {
            "question": clean_question,
            "answer": (
                "The available research paper passages do not contain enough information "
                "to answer this question."
            ),
            "sources": sources,
            "status": "insufficient_context",
            "model": None
        }

    # STEP 4: CONSTRUCT GROUNDED CONTEXT
    context_str = construct_context(chunks)

    # STEP 5: PREPARE EDUCATIONAL RESEARCH ASSISTANT PROMPT
    system_instruction = (
        "You are an expert AI research assistant. Your task is to provide clear, accurate, and educational answers "
        "to questions about research papers based strictly on the provided context.\n\n"
        "Guidelines:\n"
        "1. Explain technical concepts in simple, intuitive terms first, then explain the technical mechanics.\n"
        "2. When explaining mechanisms (e.g., self-attention, multi-head attention, positional encoding), "
        "break down the key components (such as queries, keys, values, dimensions, attention scores).\n"
        "3. Use clear paragraphs and bullet points where helpful to organize complex explanations.\n"
        "4. Preserve mathematical notations and formulas when relevant (e.g., Attention(Q, K, V)).\n"
        "5. Accurately cite the paper title and specific page numbers for your claims based on the passages.\n"
        "6. If the provided context does not contain enough information to fully answer the question, clearly state "
        "what is and is not covered. Never fabricate facts, external citations, or information outside the passages."
    )

    prompt_user_content = (
        f"Research Paper Context:\n{context_str}\n\n"
        f"Question: {clean_question}\n\n"
        "Grounded Answer:"
    )

    answer_text = None
    used_model = None
    generation_error = None

    # STEP 6: PRIMARY TIER — GROQ GENERATION
    groq_client = get_groq_client()
    if groq_client is not None:
        candidate_models = [DEFAULT_GROQ_MODEL]
        for m in FALLBACK_GROQ_MODELS:
            if m not in candidate_models:
                candidate_models.append(m)

        for candidate_model in candidate_models:
            try:
                print(f"[RAG Generation] Attempting generation with Groq model '{candidate_model}'...", flush=True)
                t_gen_start = time.perf_counter()

                response = groq_client.chat.completions.create(
                    model=candidate_model,
                    messages=[
                        {"role": "system", "content": system_instruction},
                        {"role": "user", "content": prompt_user_content}
                    ],
                    temperature=0.2,
                    max_tokens=gen_tokens_limit
                )

                gen_elapsed = time.perf_counter() - t_gen_start
                choice = response.choices[0]
                message = choice.message
                content = (message.content or "").strip()

                # Some reasoning models put output in reasoning if max_tokens was tight
                if not content and getattr(message, "reasoning", None):
                    content = str(message.reasoning).strip()

                if content:
                    answer_text = content
                    used_model = candidate_model
                    print(
                        f"[RAG Success] Generated answer via Groq ({candidate_model}) in {gen_elapsed:.2f}s "
                        f"({response.usage.completion_tokens if hasattr(response, 'usage') and response.usage else '?'} tokens).",
                        flush=True
                    )
                    break
                else:
                    print(f"[RAG Warning] Groq model '{candidate_model}' returned empty content.", flush=True)

            except Exception as cand_err:
                generation_error = cand_err
                print(f"[RAG Warning] Groq candidate model '{candidate_model}' failed: {cand_err}", flush=True)

    # STEP 7: SECONDARY TIER — LOCAL LIQUIDAI FALLBACK
    if not answer_text:
        print("[RAG Notice] Groq unavailable or failed. Attempting local model fallback...", flush=True)
        try:
            t_loc_start = time.perf_counter()
            answer_text = generate_local_answer(
                context_str=context_str,
                question=clean_question,
                max_tokens=min(gen_tokens_limit, 400)
            )
            used_model = f"local:{LOCAL_MODEL_ID}"
            print(f"[RAG Success] Generated answer via Local LLM in {time.perf_counter() - t_loc_start:.2f}s.", flush=True)
        except Exception as local_err:
            print(f"[RAG Error] Local LLM fallback generation failed: {local_err}", flush=True)
            generation_error = local_err

    # STEP 8: FINAL DISPOSITION
    total_elapsed = time.perf_counter() - total_start_time

    if answer_text:
        print(
            f"[RAG Pipeline Timing] Retrieval: {retrieval_elapsed:.3f}s | "
            f"Total: {total_elapsed:.2f}s | Model: {used_model}",
            flush=True
        )
        return {
            "question": clean_question,
            "answer": answer_text,
            "sources": sources,
            "status": "success",
            "model": used_model
        }

    # If generation failed completely across all tiers, DO NOT fake an answer using chunks
    print(f"[RAG Error] All generation tiers failed. Reason: {generation_error}", flush=True)
    traceback.print_exc()

    return {
        "question": clean_question,
        "answer": (
            "AI answer generation is currently unavailable due to an inference service issue. "
            "The retrieved passages are provided below for your reference."
        ),
        "sources": sources,
        "status": "llm_failed",
        "error": str(generation_error),
        "model": None
    }
