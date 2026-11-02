from src.model_loader import get_embedding_model


def embed_chunks(chunks):
    """
    Generates normalized 768-dimensional vector embeddings for a list of chunks
    using the shared BAAI/bge-base-en-v1.5 embedding model singleton.
    """
    if not chunks:
        return []

    model = get_embedding_model()
    texts = [chunk["text"] for chunk in chunks]

    embeddings = model.encode(
        texts,
        normalize_embeddings=True,
        show_progress_bar=False
    )

    for chunk, embedding in zip(chunks, embeddings):
        chunk["embedding"] = embedding.tolist()

    return chunks
