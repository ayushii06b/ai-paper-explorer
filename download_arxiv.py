import os
import csv
import time
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET

# =========================
# SETTINGS
# =========================

NUMBER_OF_PAPERS = 40

OUTPUT_FOLDER = "Data/papers"
METADATA_FILE = "Data/arxiv_metadata.csv"

# AI / ML / NLP / Computer Vision
SEARCH_QUERY = "cat:cs.AI OR cat:cs.LG OR cat:cs.CL OR cat:cs.CV"

API_URL =  "http://export.arxiv.org/api/query"


# =========================
# CREATE FOLDERS
# =========================

os.makedirs(OUTPUT_FOLDER, exist_ok=True)
os.makedirs("Data", exist_ok=True)


# =========================
# GET ARXIV METADATA
# =========================

params = {
    "search_query": SEARCH_QUERY,
    "start": 0,
    "max_results": NUMBER_OF_PAPERS,
    "sortBy": "submittedDate",
    "sortOrder": "descending"
}

url = API_URL + "?" + urllib.parse.urlencode(params)

print("Requesting papers from arXiv...")
print(url)

request = urllib.request.Request(
    url,
    headers={
        "User-Agent": "AI-Research-Paper-Explorer/1.0"
    }
)

with urllib.request.urlopen(request) as response:
    data = response.read()

root = ET.fromstring(data)

namespace = {
    "atom": "http://www.w3.org/2005/Atom"
}


# =========================
# PROCESS RESULTS
# =========================

papers = root.findall("atom:entry", namespace)

print(f"\nFound {len(papers)} papers.\n")

metadata_rows = []

for index, paper in enumerate(papers, start=1):

    title = paper.find("atom:title", namespace).text.strip()
    title = " ".join(title.split())

    abstract = paper.find("atom:summary", namespace).text.strip()
    abstract = " ".join(abstract.split())

    published = paper.find("atom:published", namespace).text.strip()

    arxiv_url = paper.find("atom:id", namespace).text.strip()

    # Extract arXiv ID
    arxiv_id = arxiv_url.split("/")[-1]

    # Remove version from filename
    clean_id = arxiv_id.split("v")[0]

    # Authors
    authors = []

    for author in paper.findall("atom:author", namespace):
        name = author.find("atom:name", namespace)
        if name is not None:
            authors.append(name.text.strip())

    authors_text = "; ".join(authors)

    # Categories
    categories = []

    for category in paper.findall("atom:category", namespace):
        term = category.attrib.get("term")
        if term:
            categories.append(term)

    category_text = "; ".join(categories)

    # PDF URL
    pdf_url = f"https://arxiv.org/pdf/{clean_id}.pdf"

    pdf_path = os.path.join(
        OUTPUT_FOLDER,
        f"{clean_id.replace('/', '_')}.pdf"
    )

    print(f"[{index}/{len(papers)}] {title}")
    print(f"      arXiv ID: {clean_id}")

    # =========================
    # DOWNLOAD PDF
    # =========================

    if os.path.exists(pdf_path):

        print("      PDF already exists - skipping download")

    else:

        try:

            pdf_request = urllib.request.Request(
                pdf_url,
                headers={
                    "User-Agent": "AI-Research-Paper-Explorer/1.0"
                }
            )

            with urllib.request.urlopen(pdf_request) as pdf_response:
                pdf_data = pdf_response.read()

            with open(pdf_path, "wb") as file:
                file.write(pdf_data)

            print("      PDF downloaded")

        except Exception as error:

            print(f"      PDF download failed: {error}")
            continue

    # =========================
    # SAVE METADATA
    # =========================

    metadata_rows.append({
        "arxiv_id": clean_id,
        "title": title,
        "authors": authors_text,
        "abstract": abstract,
        "categories": category_text,
        "published": published,
        "pdf_url": pdf_url,
        "pdf_path": pdf_path
    })

    # arXiv recommends spacing repeated API requests.
    time.sleep(3)


# =========================
# WRITE CSV
# =========================

with open(
    METADATA_FILE,
    "w",
    newline="",
    encoding="utf-8"
) as file:

    fieldnames = [
        "arxiv_id",
        "title",
        "authors",
        "abstract",
        "categories",
        "published",
        "pdf_url",
        "pdf_path"
    ]

    writer = csv.DictWriter(
        file,
        fieldnames=fieldnames
    )

    writer.writeheader()

    writer.writerows(metadata_rows)


print("\n===================================")
print("DOWNLOAD COMPLETE")
print("===================================")

print(f"Papers downloaded: {len(metadata_rows)}")
print(f"PDF folder: {OUTPUT_FOLDER}")
print(f"Metadata: {METADATA_FILE}")