import os
import time
import threading
import traceback

# Ensure HuggingFace loads locally without network delays
os.environ.setdefault("HF_HUB_OFFLINE", "1")
os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")

import torch
from transformers import AutoTokenizer, AutoModelForCausalLM

from src.retrieval import search_similar_chunks

# Model identifier
MODEL_ID = "LiquidAI/LFM2.5-1.2B-Instruct"

# Configurable token generation limit for local CPU inference
DEFAULT_MAX_NEW_TOKENS = int(os.environ.get("MAX_NEW_TOKENS", "40"))

# Global lazy-loaded singleton instances and concurrency locks
_tokenizer = None
_model = None
_model_failed = False
_model_lock = threading.Lock()
_generate_lock = threading.Lock()


def load_model():
    """
    Loads and caches the local LLM tokenizer and model thread-safely.
    Reuses existing instances if already loaded.
    """
    global _tokenizer, _model, _model_failed

    if _model_failed:
        return None, None

    if _tokenizer is not None and _model is not None:
        return _tokenizer, _model

    with _model_lock:
        if _tokenizer is not None and _model is not None:
            return _tokenizer, _model

        try:
            print(f"[RAG] Loading local LLM model and tokenizer: {MODEL_ID}...", flush=True)
            t0 = time.perf_counter()
            try:
                _tokenizer = AutoTokenizer.from_pretrained(
                    MODEL_ID,
                    trust_remote_code=True,
                    local_files_only=True
                )
                _model = AutoModelForCausalLM.from_pretrained(
                    MODEL_ID,
                    dtype=torch.bfloat16,
                    trust_remote_code=True,
                    local_files_only=True,
                    low_cpu_mem_usage=True
                )
            except Exception:
                # If local_files_only fails, try standard load
                _tokenizer = AutoTokenizer.from_pretrained(
                    MODEL_ID,
                    trust_remote_code=True
                )
                _model = AutoModelForCausalLM.from_pretrained(
                    MODEL_ID,
                    dtype=torch.bfloat16,
                    trust_remote_code=True,
                    low_cpu_mem_usage=True
                )

            _model.eval()
            load_elapsed = time.perf_counter() - t0
            print(f"[RAG] Local LLM model loaded successfully in {load_elapsed:.2f}s.", flush=True)
            return _tokenizer, _model
        except Exception as e:
            print(f"[RAG Error] Failed to load local LLM model ({e}). RAG will run in fallback mode.", flush=True)
            traceback.print_exc()
            _model_failed = True
            return None, None


def construct_context(chunks, max_chunk_chars: int = 1400) -> str:
    """
    Formats retrieved chunks into a clean context string for prompt.
    Includes Paper title, Page number, and Chunk text.
    Limits individual chunk length to avoid excessive prefill latency on CPU.
    """
    context_blocks = []
    for idx, chunk in enumerate(chunks, start=1):
        clean_text = chunk["text"].strip().replace("\n", " ")
        if len(clean_text) > max_chunk_chars:
            clean_text = clean_text[:max_chunk_chars].rstrip() + "..."
        block = (
            f"[Source {idx} | Paper: {chunk['title']} | Page: {chunk['page']}]\n"
            f"{clean_text}"
        )
        context_blocks.append(block)

    return "\n\n".join(context_blocks)


def generate_rag_answer(
    question: str,
    top_k: int = 2,
    paper_id: int | None = None,
    max_new_tokens: int | None = None
) -> dict:
    """
    Executes full RAG pipeline:
    1. Semantic similarity retrieval via search_similar_chunks()
    2. Context construction
    3. Grounded LLM answer generation with timing logs
    4. Source attribution mapping
    """
    total_start_time = time.perf_counter()

    # Determine token limit
    gen_tokens_limit = max_new_tokens if max_new_tokens is not None else DEFAULT_MAX_NEW_TOKENS
    gen_tokens_limit = max(10, min(gen_tokens_limit, 100))

    # 1. Retrieve top-k relevant chunks
    t_retrieval_start = time.perf_counter()
    chunks = search_similar_chunks(question, top_k=top_k, paper_id=paper_id)
    retrieval_elapsed = time.perf_counter() - t_retrieval_start

    # 2. Extract sources
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
            "chunk_id": chunk.get("chunk_id")
        })

    # 3. Check context availability / similarity threshold
    similarity_threshold = 0.55 if paper_id is None else 0.50
    if not chunks or (chunks and chunks[0]["similarity"] < similarity_threshold):
        total_time = time.perf_counter() - total_start_time
        highest_sim = chunks[0]["similarity"] if chunks else 0.0
        print(f"[RAG] No sufficient match (highest similarity {highest_sim:.4f} < {similarity_threshold}). Query took {total_time:.3f}s.", flush=True)
        return {
            "question": question,
            "answer": "The available papers do not contain enough information to answer this question.",
            "sources": sources
        }

    # 4. Construct context
    t_prompt_start = time.perf_counter()
    context_str = construct_context(chunks)

    # 5. Load model (cached singleton)
    tokenizer, model = load_model()

    if model is None or tokenizer is None:
        total_time = time.perf_counter() - total_start_time
        print(f"[RAG] Model unavailable. Providing retrieved source summary. Query took {total_time:.3f}s.", flush=True)
        top_src = chunks[0]
        return {
            "question": question,
            "answer": (
                f"Based on {top_src['title']} (Page {top_src['page']}): "
                f"{top_src['text'].strip()[:300]}... "
                "(Local synthesis model currently offline; displaying retrieved grounded passage)."
            ),
            "sources": sources
        }

    # 6. Build Grounded Prompt
    system_instruction = (
        "You are a research paper assistant. Synthesize a concise, factual answer (1-2 sentences) "
        "based strictly on the provided research paper context. If the context does not contain the answer, "
        "state that the provided context does not contain sufficient information. Always reference the paper title and page number."
    )

    prompt_user_content = (
        f"Research Paper Context:\n{context_str}\n\n"
        f"Question: {question}\n\n"
        f"Grounded Answer:"
    )

    messages = [
        {"role": "system", "content": system_instruction},
        {"role": "user", "content": prompt_user_content}
    ]

    try:
        chat_prompt = tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True
        )
        inputs = tokenizer(chat_prompt, return_tensors="pt")
        input_token_count = inputs.input_ids.shape[1]
        prompt_elapsed = time.perf_counter() - t_prompt_start

        # 7. Model Inference (serialized to prevent CPU cache thrashing)
        t_infer_start = time.perf_counter()
        with _generate_lock:
            with torch.inference_mode():
                outputs = model.generate(
                    **inputs,
                    max_new_tokens=gen_tokens_limit,
                    do_sample=False,
                    use_cache=True,
                    pad_token_id=tokenizer.eos_token_id
                )

        infer_elapsed = time.perf_counter() - t_infer_start

        # Extract only generated new tokens
        generated_tokens = outputs[0][input_token_count:]
        new_token_count = len(generated_tokens)
        speed = new_token_count / max(infer_elapsed, 0.001)

        answer_text = tokenizer.decode(generated_tokens, skip_special_tokens=True).strip()

        # If thinking tags were included, strip reasoning preamble
        if "</think>" in answer_text:
            answer_text = answer_text.split("</think>")[-1].strip()

        # Clean trailing incomplete citation if cut off at token limit
        if "(" in answer_text and not answer_text.endswith(")"):
            last_open = answer_text.rfind("(")
            if ")" not in answer_text[last_open:]:
                answer_text = answer_text[:last_open].strip()
                if not answer_text.endswith("."):
                    answer_text += f" (as described in {chunks[0]['title']}, page {chunks[0]['page']})."

        if not answer_text:
            top_src = chunks[0]
            answer_text = (
                f"According to {top_src['title']} (Page {top_src['page']}): "
                f"{top_src['text'].strip()[:250]}..."
            )

        total_elapsed = time.perf_counter() - total_start_time

        print(
            f"[RAG Timing] Retrieval: {retrieval_elapsed:.3f}s | "
            f"Prompt ({input_token_count} toks): {prompt_elapsed:.3f}s | "
            f"Inference: {infer_elapsed:.2f}s ({new_token_count} toks, {speed:.2f} tok/s) | "
            f"Total: {total_elapsed:.2f}s",
            flush=True
        )

    except Exception as err:
        print(f"[RAG Error] Error during LLM generation: {err}", flush=True)
        traceback.print_exc()
        top_src = chunks[0]
        answer_text = (
            f"Based on {top_src['title']} (Page {top_src['page']}): "
            f"{top_src['text'].strip()[:350]}... "
            "(Grounded context retrieved from database; synthesis encountered an inference error)."
        )

    return {
        "question": question,
        "answer": answer_text,
        "sources": sources
    }
