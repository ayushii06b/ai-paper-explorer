from src.ingestion import extract_pdf
from src.chunking import chunk_document, count_tokens


pdf_path = "Data/papers/2610.02200.pdf"

pages = extract_pdf(pdf_path)

chunks = chunk_document(pages)

print("Total chunks:", len(chunks))

maximum = 0

for chunk in chunks:
    tokens = count_tokens(chunk["text"])

    if tokens > maximum:
        maximum = tokens

print("Largest chunk:", maximum, "tokens")

if maximum <= 400:
    print("SUCCESS: All chunks are within the limit.")
else:
    print("ERROR: Some chunks are still too large.")