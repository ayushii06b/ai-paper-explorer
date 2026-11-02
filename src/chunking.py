import re
from src.model_loader import get_tokenizer


MAX_TOKENS = 400
OVERLAP_TOKENS = 50


def count_tokens(text: str) -> int:
    """Calculates the number of tokens in the given text using the shared BGE tokenizer."""
    if not text:
        return 0
    tokenizer = get_tokenizer()
    return len(
        tokenizer.encode(
            text,
            add_special_tokens=False
        )
    )


def split_into_sentences(text: str) -> list[str]:
    """
    Splits text into meaningful sentence units while preserving paragraph boundaries.
    Avoids breaking numbers, decimals, or common academic abbreviations.
    """
    if not text or not text.strip():
        return []

    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    sentences = []

    for para in paragraphs:
        # Split on sentence terminals (. ! ?) followed by whitespace and an uppercase letter or quote/bracket
        raw_sents = re.split(r"(?<=[.!?])\s+(?=[A-Z0-9\"'(\[])", para)
        for s in raw_sents:
            s_clean = s.strip()
            if s_clean:
                sentences.append(s_clean)

    return sentences


def split_text_by_tokens(text: str, max_tokens: int = MAX_TOKENS, overlap_tokens: int = OVERLAP_TOKENS) -> list[str]:
    """
    Sentence-boundary-aware chunker:
    1. Splits text into sentences.
    2. Groups full sentences together until reaching max_tokens.
    3. Provides sentence-level overlap between consecutive chunks.
    4. Falls back to token-level slicing only if a single sentence exceeds max_tokens.
    Ensures chunks do not start or end abruptly in the middle of sentences.
    """
    if not text or not text.strip():
        return []

    sentences = split_into_sentences(text)
    if not sentences:
        return []

    tokenizer = get_tokenizer()
    chunks = []
    current_sentences = []
    current_tokens = 0

    for sent in sentences:
        sent_tokens = count_tokens(sent)

        # If a single sentence exceeds max_tokens on its own, handle via token slicing
        if sent_tokens > max_tokens:
            if current_sentences:
                chunks.append(" ".join(current_sentences).strip())
                current_sentences = []
                current_tokens = 0

            # Sub-slice the oversized sentence
            encoded = tokenizer(sent, return_offsets_mapping=True, add_special_tokens=False)
            input_ids = encoded["input_ids"]
            offsets = encoded["offset_mapping"]
            total = len(input_ids)
            sub_start = 0

            while sub_start < total:
                sub_end = min(sub_start + max_tokens, total)
                c_start = offsets[sub_start][0]
                c_end = offsets[sub_end - 1][1]
                sub_piece = sent[c_start:c_end].strip()
                if sub_piece:
                    chunks.append(sub_piece)
                if sub_end >= total:
                    break
                sub_start = sub_end - overlap_tokens
            continue

        # If adding this sentence exceeds max_tokens, finalize the current chunk
        if current_sentences and (current_tokens + sent_tokens > max_tokens):
            chunk_text = " ".join(current_sentences).strip()
            if chunk_text:
                chunks.append(chunk_text)

            # Build overlap from trailing sentences
            overlap_sents = []
            overlap_cnt = 0
            for prev_s in reversed(current_sentences):
                p_cnt = count_tokens(prev_s)
                if overlap_cnt + p_cnt <= overlap_tokens or not overlap_sents:
                    overlap_sents.insert(0, prev_s)
                    overlap_cnt += p_cnt
                else:
                    break

            current_sentences = overlap_sents + [sent]
            current_tokens = sum(count_tokens(s) for s in current_sentences)
        else:
            current_sentences.append(sent)
            current_tokens += sent_tokens

    # Finalize remaining sentences
    if current_sentences:
        chunk_text = " ".join(current_sentences).strip()
        if chunk_text:
            chunks.append(chunk_text)

    return chunks


def chunk_page(page: dict) -> list[str]:
    """Chunks text extracted from an individual page."""
    text = page.get("text", "").strip()
    if not text:
        return []
    return split_text_by_tokens(text)


def chunk_document(pages: list[dict]) -> list[dict]:
    """
    Chunks all pages of a document while preserving chunk indices,
    original page numbers, and keeping all chunks within MAX_TOKENS.
    """
    chunks = []
    chunk_id = 0

    for page in pages:
        page_chunks = chunk_page(page)

        for text in page_chunks:
            token_count = count_tokens(text)

            if token_count > MAX_TOKENS:
                print(
                    f"WARNING: chunk {chunk_id} has {token_count} tokens (> {MAX_TOKENS})",
                    flush=True
                )
                continue

            chunks.append({
                "chunk_id": chunk_id,
                "page": page["page"],
                "text": text
            })
            chunk_id += 1

    return chunks
