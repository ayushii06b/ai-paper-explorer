import sys
import io
from pathlib import Path

# Ensure UTF-8 output formatting on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from src.ingestion import extract_pdf, remove_references


pdf_folder = Path("Data/papers")
pdf_files = list(pdf_folder.glob("*.pdf"))

if not pdf_files:
    print("No PDF files found.")
    exit()

pdf_path = pdf_files[0]

print("Testing:", pdf_path.name)

pages = extract_pdf(str(pdf_path))

print("Original pages:", len(pages))

pages_without_references = remove_references(pages)

print(
    "Pages after reference removal:",
    len(pages_without_references)
)

print("\n" + "=" * 70)

for page in pages_without_references[-2:]:

    print("\nPAGE:", page["page"])

    print(page["text"][-1000:])
