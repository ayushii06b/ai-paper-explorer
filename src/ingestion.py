import pymupdf

def extract_pdf(pdf_path):
    pages = []

    with pymupdf.open(pdf_path) as doc:
        for page_number in range(len(doc)):
            page = doc.load_page(page_number)

            pages.append({
                "page": page_number + 1,
                "text": page.get_text("text", sort=True)
            })

    return pages

pages = extract_pdf("Data/sample paper.pdf")
