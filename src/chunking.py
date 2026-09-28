from transformers import AutoTokenizer


MODEL_NAME = "BAAI/bge-base-en-v1.5"

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)


def count_tokens(text):
    return len(
        tokenizer.encode(
            text,
            add_special_tokens=False
        )
    )


def chunk_page(page, max_tokens = 500, overlap_tokens = 75):
    text = page["text"]

    paragraphs = [
        p.strip()
        for p in text.split("\n\n")
        if p.strip()
    ]
    chunks = []
    current = []
    current_tokens = 0

    for paragraph in paragraphs:
        paragraph_tokens = count_tokens(paragraph)

        if paragraph_tokens <= max_tokens:
            if current_tokens + paragraph_tokens <= max_tokens:
                current.append(paragraph)
                current_tokens += paragraph_tokens

            else:
                if current:
                    chunks.append("\n\n".join(current))
                overlap = []
                overlap_count = 0

                for p in reversed(current):
                    p_tokens = count_tokens(p)

                    if overlap_count + p_tokens > overlap_tokens:
                        break
                    overlap.insert(0, p)
                    overlap_count += p_tokens
                current = overlap + [paragraph]
                current_tokens = overlap_count + paragraph_tokens
        else :
            if current:
                chunks.append("\n\n".join(current))
                current = []
                current_tokens = 0
            tokens = tokenizer.encode(
                paragraph,
                add_special_tokens=False
            )

            for i in range(0, len(tokens), max_tokens):
                piece_tokens = tokens[i:i + max_tokens]

                piece = tokenizer.decode(
                    piece_tokens,
                    skip_special_tokens=True
                )

                chunks.append(piece)
    if current:
        chunks.append("\n\n".join(current))
    return chunks

def chunk_document(pages):
    chunks = []

    chunk_id = 0

    for page in pages:
        page_chunks = chunk_page(page)

        for text in page_chunks:
            chunks.append({
                "chunk_id": chunk_id,
                "page": page["page"],
                "text": text
            })

            chunk_id += 1

    return chunks