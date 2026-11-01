from transformers import AutoTokenizer


MODEL_NAME = "BAAI/bge-base-en-v1.5"

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)


MAX_TOKENS = 400
OVERLAP_TOKENS = 50


def count_tokens(text):
    return len(
        tokenizer.encode(
            text,
            add_special_tokens=False
        )
    )


def split_text_by_tokens(text, max_tokens=MAX_TOKENS, overlap_tokens=OVERLAP_TOKENS):
    encoded = tokenizer(text, return_offsets_mapping=True, add_special_tokens=False)
    input_ids = encoded["input_ids"]
    offsets = encoded["offset_mapping"]

    if not input_ids:
        return []

    chunks = []
    start = 0
    total = len(input_ids)

    while start < total:
        end = min(start + max_tokens, total)
        char_start = offsets[start][0]
        char_end = offsets[end - 1][1]

        piece = text[char_start:char_end].strip()
        if piece:
            chunks.append(piece)

        if end >= total:
            break

        start = end - overlap_tokens

    return chunks


def chunk_page(page):
    text = page["text"].strip()

    if not text:
        return []

    return split_text_by_tokens(text)


def chunk_document(pages):
    chunks = []
    chunk_id = 0

    for page in pages:
        page_chunks = chunk_page(page)

        for text in page_chunks:
            # Final safety check
            token_count = count_tokens(text)

            if token_count > MAX_TOKENS:
                print(
                    f"WARNING: chunk {chunk_id} has "
                    f"{token_count} tokens"
                )
                continue

            chunks.append({
                "chunk_id": chunk_id,
                "page": page["page"],
                "text": text
            })

            chunk_id += 1

    return chunks
