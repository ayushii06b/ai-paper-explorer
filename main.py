import os
import json

from src.ingestion import extract_pdf
from src.cleaning import (
    clean_text,
    find_repeated_lines,
    remove_repeated_lines,
)
from src.chunking import chunk_document, count_tokens
from src.embedding import embed_chunks
from src.database import init_database
from src.vector_store import (
    insert_paper,
    insert_chunks,
    get_paper_chunks_count,
    verify_embeddings,
)


def main():
    PDF_PATH = "Data/sample paper.pdf"
    CLEANED_OUTPUT_PATH = "Data/cleaned_pages.json"
    CHUNKS_OUTPUT_PATH = "Data/chunks.json"
    EMBEDDINGS_OUTPUT_PATH = "Data/embedded_chunks.json"

    print("=== Step 1: PDF Extraction ===")
    pages = extract_pdf(PDF_PATH)
    print(f"Extracted {len(pages)} pages from {PDF_PATH}")

    print("\n=== Step 2: Cleaning Text ===")
    repeated_lines = find_repeated_lines(pages)
    for page in pages:
        text = page["text"]
        text = remove_repeated_lines(text, repeated_lines)
        text = clean_text(text)
        page["text"] = text

    with open(CLEANED_OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(pages, f, ensure_ascii=False, indent=2)
    print(f"Saved cleaned pages to {CLEANED_OUTPUT_PATH}")

    print("\n=== Step 3: Chunking Document ===")
    chunks = chunk_document(pages)
    print(f"Created {len(chunks)} chunks")

    for chunk in chunks:
        tokens = count_tokens(chunk["text"])
        if tokens > 500:
            print(f"WARNING: Chunk {chunk['chunk_id']} has {tokens} tokens")

    with open(CHUNKS_OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(chunks, f, ensure_ascii=False, indent=2)
    print(f"Saved chunks to {CHUNKS_OUTPUT_PATH}")

    print("\n=== Step 4: Generating Embeddings (BAAI/bge-base-en-v1.5) ===")
    chunks = embed_chunks(chunks)
    print("Number of embeddings:", len(chunks))
    embedding_dim = len(chunks[0]["embedding"])
    print("Embedding dimensions:", embedding_dim)

    with open(EMBEDDINGS_OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(chunks, f, ensure_ascii=False, indent=2)
    print(f"Saved embedded chunks to {EMBEDDINGS_OUTPUT_PATH}")

    print("\n=== Step 5: Database Setup & Population ===")
    init_database()

    paper_title = "Sample AI Research Paper"
    paper_id = insert_paper(
        title=paper_title,
        authors="Unknown",
        year=2026,
        category="Artificial Intelligence",
        pdf_path=PDF_PATH
    )
    print(f"Inserted paper record: ID={paper_id}, Title='{paper_title}'")

    insert_chunks(paper_id, chunks)

    print("\n=== Step 6: Database Storage Verification ===")
    stored_count = get_paper_chunks_count(paper_id)
    print(f"Total chunks stored in PostgreSQL for paper_id={paper_id}: {stored_count}")

    samples = verify_embeddings(paper_id)
    print(f"Verified {len(samples)} sample chunk embedding records:")
    for sample in samples:
        print(
            f"  - Chunk ID: {sample['chunk_id']} | Page: {sample['page_number']} | "
            f"Dim: {sample['embedding_dim']} | First 5 Vector Values: {sample['sample_vector_values']}"
        )

    print("\nPipeline up to DATABASE SETUP completed successfully.")


if __name__ == "__main__":
    main()