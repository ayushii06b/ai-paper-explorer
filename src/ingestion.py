import fitz
import re


def extract_pdf(pdf_path):
    """
    Extract text from a PDF page by page.
    """

    document = fitz.open(pdf_path)

    pages = []

    for page_number, page in enumerate(document, start=1):
        text = page.get_text()

        pages.append({
            "page": page_number,
            "text": text
        })

    document.close()

    return pages


def remove_references(pages):
    """
    Remove the references/bibliography section
    while preserving the original page numbers.
    """

    reference_headings = [
        "references",
        "bibliography",
        "references and notes",
        "bibliography and references"
    ]

    # Find the LAST reference heading.
    reference_location = None

    for page_index, page in enumerate(pages):

        lines = page["text"].splitlines()

        for line_index, line in enumerate(lines):

            stripped = line.strip()

            # Handles:
            # References
            # 7 References
            # 7. References
            # 7.1 References
            cleaned = re.sub(
                r"^\d+(?:\.\d+)*[\s.)-]*",
                "",
                stripped
            )

            normalized = (
                cleaned
                .lower()
                .replace(":", "")
                .strip()
            )

            if normalized in reference_headings:
                reference_location = (
                    page_index,
                    line_index
                )

    if reference_location is None:
        print("No references section detected.")
        return pages

    reference_page_index, reference_line_index = reference_location

    print(
        f"References detected on page "
        f"{pages[reference_page_index]['page']}"
    )

    cleaned_pages = []

    for page_index, page in enumerate(pages):

        if page_index < reference_page_index:

            cleaned_pages.append(page)

        elif page_index == reference_page_index:

            lines = page["text"].splitlines()

            kept_lines = lines[:reference_line_index]

            cleaned_pages.append({
                "page": page["page"],
                "text": "\n".join(kept_lines)
            })

            break

        else:
            break

    return cleaned_pages
