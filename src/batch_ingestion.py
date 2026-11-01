import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))


from src.ingestion import (
    extract_pdf,
    remove_references
)

from src.cleaning import (
    clean_text,
    find_repeated_lines,
    remove_repeated_lines
)

from src.chunking import chunk_document
from src.embedding import embed_chunks
from src.vector_store import insert_paper, insert_chunks


DATA_FOLDER = PROJECT_ROOT / "Data" / "papers"


def process_paper(pdf_path):

    print("\n" + "=" * 60)
    print(f"Processing: {pdf_path.name}")
    print("=" * 60)

    # 1. Extract PDF
    pages = extract_pdf(str(pdf_path))

    print(f"Extracted {len(pages)} pages")

    # 2. Remove references / bibliography
    pages = remove_references(pages)

    print(
        f"Pages remaining after reference removal: "
        f"{len(pages)}"
    )

    # 3. Find repeated lines
    repeated_lines = find_repeated_lines(pages)

    # 4. Clean pages
    for page in pages:

        text = page["text"]

        text = remove_repeated_lines(
            text,
            repeated_lines
        )

        text = clean_text(text)

        page["text"] = text

    print("Cleaning completed.")

    # 5. Create chunks
    chunks = chunk_document(pages)

    print(f"Created {len(chunks)} chunks")

    if not chunks:
        print("No chunks created. Skipping paper.")
        return

    # 6. Generate embeddings
    chunks = embed_chunks(chunks)

    print(f"Generated {len(chunks)} embeddings")

    # 7. Insert paper metadata
    paper_id = insert_paper(
        title=pdf_path.stem,
        authors=None,
        year=None,
        category=None,
        pdf_path=str(pdf_path)
    )

    print(f"Paper inserted with ID: {paper_id}")

    # 8. Insert chunks + embeddings
    insert_chunks(
        paper_id,
        chunks
    )

    print(f"Successfully processed: {pdf_path.name}")


def main():

    pdf_files = list(DATA_FOLDER.glob("*.pdf"))

    print(f"Found {len(pdf_files)} PDF files.")

    for index, pdf_path in enumerate(pdf_files, start=1):

        print(f"\n\nPAPER {index}/{len(pdf_files)}")

        try:

            process_paper(pdf_path)

        except Exception as error:

            print(
                f"\nERROR processing "
                f"{pdf_path.name}:"
            )

            print(error)

    print("\n" + "=" * 60)
    print("BATCH INGESTION COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    main()