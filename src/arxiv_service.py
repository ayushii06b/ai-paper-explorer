import os
import re
import threading
import urllib.request
import urllib.parse
import urllib.error
import xml.etree.ElementTree as ET
from typing import List, Dict, Optional, Any

from src.database import get_connection
from src.vector_store import (
    insert_paper,
    insert_chunks,
    find_paper_by_arxiv_id,
    get_paper_chunks_count,
    insert_paper_with_chunks,
    delete_paper_by_id
)

# Trusted arXiv domains
ALLOWED_ARXIV_DOMAINS = {"arxiv.org", "export.arxiv.org", "www.arxiv.org"}
MAX_PDF_SIZE_BYTES = 30 * 1024 * 1024  # 30 MB limit
DOWNLOAD_TIMEOUT_SECONDS = 30
USER_AGENT = "AI-Paper-Explorer/1.0 (academic research tool; mailto:research@example.com)"

# In-memory dictionary for tracking async preparation tasks
# arxiv_id -> {"arxiv_id": str, "status": str, "progress": str, "paper_id": Optional[int], "chunk_count": int, "error": Optional[str]}
_PROCESSING_TASKS: Dict[str, Dict[str, Any]] = {}
_TASKS_LOCK = threading.Lock()

# Search query cache: cache_key -> (timestamp, result_dict)
_SEARCH_CACHE: Dict[str, Any] = {}
_CACHE_TTL_SECONDS = 300  # 5 minutes
_LAST_REQUEST_TIME = 0.0
_REQUEST_LOCK = threading.Lock()


def get_download_dir() -> str:
    """Returns absolute path to local download directory for research papers."""
    download_dir = os.path.join(os.getcwd(), "Data", "downloaded_papers")
    os.makedirs(download_dir, exist_ok=True)
    return download_dir


def sanitize_arxiv_id(arxiv_id: str) -> str:
    """Sanitizes an arXiv ID to prevent directory traversal and special character injection."""
    cleaned = arxiv_id.strip()
    # Remove any url prefixes if present
    cleaned = re.sub(r"^https?://arxiv\.org/(?:abs|pdf)/", "", cleaned)
    cleaned = re.sub(r"\.pdf$", "", cleaned)
    # Allow only alphanumeric, dot, hyphen, underscore
    safe_id = re.sub(r"[^a-zA-Z0-9._-]", "_", cleaned)
    return safe_id


def search_arxiv(query: str, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
    """
    Queries the official arXiv API Atom feed and returns structured paper results.
    Cross-references existing PostgreSQL database to identify already-ingested papers.
    Includes in-memory caching and graceful rate limit (HTTP 429) handling.
    """
    import time

    clean_q = query.strip()
    if not clean_q:
        return {"papers": [], "total_results": 0, "page": page, "page_size": page_size}

    page = max(1, page)
    page_size = min(max(1, page_size), 30)
    start_idx = (page - 1) * page_size

    # Check cache first
    cache_key = f"{clean_q.lower()}::{page}::{page_size}"
    now = time.time()
    if cache_key in _SEARCH_CACHE:
        cached_time, cached_data = _SEARCH_CACHE[cache_key]
        if now - cached_time < _CACHE_TTL_SECONDS:
            return cached_data

    # Check if query is directly an arXiv ID
    arxiv_id_pattern = r"^(?:arxiv:)?([0-9]{4}\.[0-9]{4,5}(?:v[0-9]+)?|[a-zA-Z\-]+/[0-9]{7}(?:v[0-9]+)?)$"
    id_match = re.match(arxiv_id_pattern, clean_q, re.IGNORECASE)

    # If it's an exact arXiv ID that already exists in local DB, check local DB first!
    if id_match:
        extracted_id = id_match.group(1)
        local_paper = find_paper_by_arxiv_id(extracted_id)
        if local_paper:
            # We already have this paper in local database!
            local_result = {
                "arxiv_id": extracted_id,
                "base_id": re.sub(r"v\d+$", "", extracted_id),
                "title": local_paper["title"],
                "authors": [local_paper["authors"]] if local_paper.get("authors") else ["arXiv Author"],
                "authors_str": local_paper.get("authors") or "arXiv Author",
                "year": local_paper.get("year") or 2026,
                "published": str(local_paper.get("year") or 2026),
                "abstract": f"Stored in local library (ID: {local_paper['id']}). Ready for instant Q&A.",
                "category": local_paper.get("category") or "cs.AI",
                "categories": [local_paper.get("category") or "cs.AI"],
                "arxiv_url": f"https://arxiv.org/abs/{extracted_id}",
                "pdf_url": f"https://arxiv.org/pdf/{extracted_id}.pdf",
                "is_ingested": True,
                "local_paper_id": local_paper["id"]
            }
            res_dict = {
                "papers": [local_result],
                "total_results": 1,
                "page": page,
                "page_size": page_size
            }
            _SEARCH_CACHE[cache_key] = (now, res_dict)
            return res_dict

        api_url = f"https://export.arxiv.org/api/query?id_list={urllib.parse.quote(extracted_id)}&start=0&max_results={page_size}"
    else:
        # Check if user query includes specific prefixes like ti:, au:, all:
        if any(clean_q.startswith(prefix) for prefix in ["ti:", "au:", "all:", "abs:", "cat:"]):
            search_query = clean_q
        else:
            search_query = f"all:{clean_q}"
        encoded_query = urllib.parse.quote(search_query)
        api_url = (
            f"https://export.arxiv.org/api/query?search_query={encoded_query}"
            f"&start={start_idx}&max_results={page_size}&sortBy=relevance&sortOrder=descending"
        )

    req = urllib.request.Request(api_url, headers={"User-Agent": USER_AGENT})

    # Rate limiting: wait if less than 2.5s since last arXiv request
    global _LAST_REQUEST_TIME
    with _REQUEST_LOCK:
        elapsed = now - _LAST_REQUEST_TIME
        if elapsed < 2.5:
            time.sleep(2.5 - elapsed)
        _LAST_REQUEST_TIME = time.time()

    xml_bytes = None
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            xml_bytes = resp.read()
    except urllib.error.HTTPError as e:
        if e.code == 429:
            # Check if we have stale cache
            if cache_key in _SEARCH_CACHE:
                return _SEARCH_CACHE[cache_key][1]
            return {
                "papers": [],
                "total_results": 0,
                "page": page,
                "page_size": page_size,
                "warning": "arXiv API rate limit reached. Please wait a few seconds before searching again.",
                "rate_limited": True
            }
        elif e.code == 503:
            return {
                "papers": [],
                "total_results": 0,
                "page": page,
                "page_size": page_size,
                "warning": "arXiv API is temporarily unavailable (503 Service Unavailable). Please retry shortly.",
                "rate_limited": False
            }
        raise RuntimeError(f"arXiv API HTTP error: {e.code} {e.reason}")
    except urllib.error.URLError as e:
        raise RuntimeError(f"Failed to connect to arXiv API: {str(e.reason)}")
    except TimeoutError:
        return {
            "papers": [],
            "total_results": 0,
            "page": page,
            "page_size": page_size,
            "warning": "arXiv API request timed out. Please try again.",
            "rate_limited": False
        }
    except Exception as e:
        raise RuntimeError(f"Error querying arXiv API: {str(e)}")

    try:
        root = ET.fromstring(xml_bytes)
    except ET.ParseError as e:
        raise RuntimeError(f"Failed to parse arXiv API XML response: {str(e)}")

    ns = {
        "atom": "http://www.w3.org/2005/Atom",
        "opensearch": "http://a9.com/-/spec/opensearch/1.1/",
        "arxiv": "http://arxiv.org/schemas/atom"
    }

    # Extract total results if available
    total_results_elem = root.find("opensearch:totalResults", ns)
    total_results = int(total_results_elem.text) if total_results_elem is not None and total_results_elem.text.isdigit() else 0

    entries = root.findall("atom:entry", ns)
    papers = []
    found_ids_for_db_check = []

    for entry in entries:
        raw_id = entry.find("atom:id", ns)
        raw_id_text = raw_id.text.strip() if raw_id is not None and raw_id.text else ""

        # Extract paper ID from atom:id URL (e.g., http://arxiv.org/abs/2310.02142v1)
        arxiv_match = re.search(r"(\d{4}\.\d{4,5}(?:v\d+)?|[a-zA-Z\-]+/\d{7}(?:v\d+)?)", raw_id_text)
        arxiv_id = arxiv_match.group(1) if arxiv_match else raw_id_text.split("/")[-1]
        base_id = re.sub(r"v\d+$", "", arxiv_id)

        title_elem = entry.find("atom:title", ns)
        title = title_elem.text.strip().replace("\n", " ") if title_elem is not None and title_elem.text else "Untitled Paper"
        # Clean double spaces in title
        title = re.sub(r"\s+", " ", title)

        summary_elem = entry.find("atom:summary", ns)
        abstract = summary_elem.text.strip().replace("\n", " ") if summary_elem is not None and summary_elem.text else ""
        abstract = re.sub(r"\s+", " ", abstract)

        published_elem = entry.find("atom:published", ns)
        published_str = published_elem.text.strip() if published_elem is not None and published_elem.text else ""
        year = int(published_str[:4]) if len(published_str) >= 4 and published_str[:4].isdigit() else 2026

        authors = []
        for author in entry.findall("atom:author", ns):
            name_elem = author.find("atom:name", ns)
            if name_elem is not None and name_elem.text:
                authors.append(name_elem.text.strip())

        categories = []
        for cat in entry.findall("atom:category", ns):
            term = cat.attrib.get("term")
            if term:
                categories.append(term)

        # Primary category
        prim_cat_elem = entry.find("arxiv:primary_category", ns)
        primary_category = prim_cat_elem.attrib.get("term") if prim_cat_elem is not None else (categories[0] if categories else "cs.AI")

        # Links
        abs_url = f"https://arxiv.org/abs/{arxiv_id}"
        pdf_url = f"https://arxiv.org/pdf/{arxiv_id}.pdf"
        for link in entry.findall("atom:link", ns):
            rel = link.attrib.get("rel")
            link_type = link.attrib.get("type")
            title_attr = link.attrib.get("title")
            href = link.attrib.get("href", "")

            if title_attr == "pdf" or link_type == "application/pdf":
                pdf_url = href.replace("http://", "https://")
            elif rel == "alternate":
                abs_url = href.replace("http://", "https://")

        paper_item = {
            "arxiv_id": arxiv_id,
            "base_id": base_id,
            "title": title,
            "authors": authors,
            "authors_str": ", ".join(authors) if authors else "Unknown Authors",
            "year": year,
            "published": published_str,
            "abstract": abstract,
            "category": primary_category,
            "categories": categories,
            "arxiv_url": abs_url,
            "pdf_url": pdf_url,
            "is_ingested": False,
            "local_paper_id": None
        }
        papers.append(paper_item)
        found_ids_for_db_check.append(arxiv_id)
        found_ids_for_db_check.append(base_id)

    # Cross-reference local PostgreSQL database in one batch query
    if papers and found_ids_for_db_check:
        try:
            conn = get_connection()
            cur = conn.cursor()
            query_sql = """
                SELECT id, arxiv_id, title
                FROM papers
                WHERE arxiv_id IN %s OR title IN %s;
            """
            id_tuple = tuple(found_ids_for_db_check)
            cur.execute(query_sql, (id_tuple, id_tuple))
            existing_rows = cur.fetchall()
            cur.close()
            conn.close()

            # Map matching IDs
            existing_map = {}
            for row in existing_rows:
                db_id, db_arxiv_id, db_title = row
                if db_arxiv_id:
                    existing_map[db_arxiv_id] = db_id
                    existing_map[re.sub(r"v\d+$", "", db_arxiv_id)] = db_id
                if db_title:
                    existing_map[db_title] = db_id

            for p in papers:
                match_id = existing_map.get(p["arxiv_id"]) or existing_map.get(p["base_id"])
                if match_id is not None:
                    p["is_ingested"] = True
                    p["local_paper_id"] = match_id
        except Exception as e:
            print(f"Warning: Failed to cross-reference database for arXiv papers: {e}")

    result_dict = {
        "papers": papers,
        "total_results": total_results or len(papers),
        "page": page,
        "page_size": page_size
    }
    _SEARCH_CACHE[cache_key] = (now, result_dict)
    return result_dict


def download_arxiv_pdf(arxiv_id: str, pdf_url: Optional[str] = None) -> str:
    """
    Downloads an official arXiv paper PDF safely to the local Data/downloaded_papers directory.
    Validates domain, content size, timeouts, and %PDF- magic bytes.
    """
    safe_id = sanitize_arxiv_id(arxiv_id)
    output_dir = get_download_dir()
    target_path = os.path.join(output_dir, f"{safe_id}.pdf")

    # If already downloaded and valid, reuse file
    if os.path.exists(target_path) and os.path.getsize(target_path) > 1024:
        with open(target_path, "rb") as f:
            header = f.read(5)
            if header.startswith(b"%PDF-"):
                return target_path

    # Construct safe arXiv PDF URL
    if pdf_url:
        parsed = urllib.parse.urlparse(pdf_url)
        if parsed.hostname not in ALLOWED_ARXIV_DOMAINS:
            # Force official arXiv domain
            pdf_url = f"https://arxiv.org/pdf/{safe_id}.pdf"
    else:
        pdf_url = f"https://arxiv.org/pdf/{safe_id}.pdf"

    # Ensure .pdf extension in URL
    if not pdf_url.endswith(".pdf"):
        pdf_url = f"{pdf_url}.pdf"

    req = urllib.request.Request(
        pdf_url,
        headers={"User-Agent": USER_AGENT}
    )

    try:
        with urllib.request.urlopen(req, timeout=DOWNLOAD_TIMEOUT_SECONDS) as response:
            if response.status != 200:
                raise RuntimeError(f"arXiv PDF download failed with HTTP status {response.status}")

            content_length = response.headers.get("Content-Length")
            if content_length and int(content_length) > MAX_PDF_SIZE_BYTES:
                raise ValueError(
                    f"PDF file size ({int(content_length) // 1024 // 1024}MB) exceeds "
                    f"maximum allowed limit of {MAX_PDF_SIZE_BYTES // 1024 // 1024}MB."
                )

            downloaded_bytes = bytearray()
            while True:
                chunk = response.read(64 * 1024)
                if not chunk:
                    break
                downloaded_bytes.extend(chunk)
                if len(downloaded_bytes) > MAX_PDF_SIZE_BYTES:
                    raise ValueError(f"Download aborted: file exceeded maximum size of {MAX_PDF_SIZE_BYTES // 1024 // 1024}MB.")

    except urllib.error.HTTPError as e:
        raise RuntimeError(f"HTTP error downloading arXiv PDF: {e.code} {e.reason}")
    except urllib.error.URLError as e:
        raise RuntimeError(f"Network error connecting to arXiv PDF server: {str(e.reason)}")
    except TimeoutError:
        raise RuntimeError(f"PDF download timed out after {DOWNLOAD_TIMEOUT_SECONDS} seconds.")

    # Validate PDF magic bytes
    if not downloaded_bytes.startswith(b"%PDF-"):
        raise ValueError("Downloaded file is not a valid PDF document (missing %PDF- header).")

    # Write safely to disk
    with open(target_path, "wb") as f:
        f.write(downloaded_bytes)

    return target_path


def process_and_ingest_paper(
    arxiv_id: str,
    title: str,
    authors: Optional[str] = None,
    year: Optional[int] = None,
    category: Optional[str] = None,
    pdf_url: Optional[str] = None,
    progress_callback=None
) -> Dict[str, Any]:
    """
    Full pipeline to ingest an external arXiv paper into PostgreSQL + pgvector:
    1. Check if already exists in DB
    2. Download PDF with safety limits
    3. Extract text page-by-page via PyMuPDF (fitz)
    4. Clean text & remove references
    5. Chunk with BGE tokenizer (400 tokens / 50 overlap)
    6. Generate 768-dim vector embeddings
    7. Store paper and chunks into PostgreSQL + pgvector
    """
    clean_arxiv_id = sanitize_arxiv_id(arxiv_id)

    # 1. Check if paper already exists
    existing = find_paper_by_arxiv_id(clean_arxiv_id)
    if existing:
        chunk_count = get_paper_chunks_count(existing["id"])
        if chunk_count > 0:
            return {
                "paper_id": existing["id"],
                "status": "already_exists",
                "chunk_count": chunk_count,
                "title": existing["title"]
            }
        else:
            # Clean up prior orphaned record with 0 chunks so it can be re-ingested cleanly
            print(f"[Ingestion] Cleaning up orphaned paper record ID {existing['id']} (0 chunks) for re-ingestion.")
            delete_paper_by_id(existing["id"])

    # 2. Download PDF
    if progress_callback:
        progress_callback("Downloading PDF from arXiv...")
    pdf_path = download_arxiv_pdf(clean_arxiv_id, pdf_url)

    # 3. Extract text
    if progress_callback:
        progress_callback("Extracting text with PyMuPDF...")
    from src.ingestion import extract_pdf, remove_references
    from src.cleaning import find_repeated_lines, remove_repeated_lines, clean_text
    from src.chunking import chunk_document
    from src.embedding import embed_chunks

    try:
        pages = extract_pdf(pdf_path)
    except Exception as e:
        raise ValueError(f"Failed to read PDF file: {str(e)}")

    if not pages:
        raise ValueError("PDF contains no pages or could not be read.")

    total_extracted_chars = sum(len(p.get("text", "").strip()) for p in pages)
    if total_extracted_chars < 50:
        raise ValueError("PDF contains no extractable text. The document may be scanned, image-only, or encrypted.")

    # 4. Clean text and remove references
    if progress_callback:
        progress_callback("Removing references and cleaning headers...")
    cleaned_pages = remove_references(pages)
    repeated_lines = find_repeated_lines(cleaned_pages)

    for page in cleaned_pages:
        raw_text = page.get("text", "")
        no_repeats = remove_repeated_lines(raw_text, repeated_lines)
        page["text"] = clean_text(no_repeats)

    # 5. Token-based Chunking
    if progress_callback:
        progress_callback("Chunking document with BGE tokenizer...")
    chunks = chunk_document(cleaned_pages)

    if not chunks:
        raise ValueError("Could not extract any valid text chunks from the paper.")

    # 6. Generate Vector Embeddings
    if progress_callback:
        progress_callback(f"Generating 768-dim vector embeddings for {len(chunks)} chunks...")
    embedded_chunks = embed_chunks(chunks)

    # 7. Store in PostgreSQL + pgvector atomically
    if progress_callback:
        progress_callback("Storing paper metadata and vectors into PostgreSQL...")
    paper_id = insert_paper_with_chunks(
        title=title or clean_arxiv_id,
        authors=authors,
        year=year,
        category=category,
        pdf_path=pdf_path,
        arxiv_id=clean_arxiv_id,
        chunks=embedded_chunks
    )

    if progress_callback:
        progress_callback("Paper preparation complete!")

    return {
        "paper_id": paper_id,
        "status": "completed",
        "chunk_count": len(chunks),
        "title": title or clean_arxiv_id
    }


def _background_prepare_task(
    arxiv_id: str,
    title: str,
    authors: Optional[str] = None,
    year: Optional[int] = None,
    category: Optional[str] = None,
    pdf_url: Optional[str] = None
):
    """Worker function executed in background thread."""
    clean_id = sanitize_arxiv_id(arxiv_id)

    def update_progress(msg: str):
        with _TASKS_LOCK:
            if clean_id in _PROCESSING_TASKS:
                _PROCESSING_TASKS[clean_id]["progress"] = msg

    try:
        result = process_and_ingest_paper(
            arxiv_id=clean_id,
            title=title,
            authors=authors,
            year=year,
            category=category,
            pdf_url=pdf_url,
            progress_callback=update_progress
        )
        with _TASKS_LOCK:
            _PROCESSING_TASKS[clean_id] = {
                "arxiv_id": clean_id,
                "status": "completed",
                "progress": "Preparation complete and ready for Q&A!",
                "paper_id": result["paper_id"],
                "chunk_count": result.get("chunk_count", 0),
                "error": None
            }
    except Exception as err:
        print(f"Error during background paper preparation for {clean_id}: {err}")
        with _TASKS_LOCK:
            _PROCESSING_TASKS[clean_id] = {
                "arxiv_id": clean_id,
                "status": "failed",
                "progress": "Processing failed.",
                "paper_id": None,
                "chunk_count": 0,
                "error": str(err)
            }


def prepare_paper_async(
    arxiv_id: str,
    title: str,
    authors: Optional[str] = None,
    year: Optional[int] = None,
    category: Optional[str] = None,
    pdf_url: Optional[str] = None
) -> Dict[str, Any]:
    """
    Initiates asynchronous paper preparation.
    If already in DB or currently processing, returns existing state.
    """
    clean_id = sanitize_arxiv_id(arxiv_id)

    # 1. Check DB first
    existing = find_paper_by_arxiv_id(clean_id)
    if existing:
        count = get_paper_chunks_count(existing["id"])
        return {
            "arxiv_id": clean_id,
            "status": "completed",
            "progress": "Paper already in library.",
            "paper_id": existing["id"],
            "chunk_count": count,
            "error": None
        }

    # 2. Check in-progress tasks
    with _TASKS_LOCK:
        if clean_id in _PROCESSING_TASKS:
            task = _PROCESSING_TASKS[clean_id]
            if task["status"] == "processing":
                return task
            elif task["status"] == "completed":
                return task
            # If previous failed, allow retry

        # Start new task
        _PROCESSING_TASKS[clean_id] = {
            "arxiv_id": clean_id,
            "status": "processing",
            "progress": "Initiating paper preparation...",
            "paper_id": None,
            "chunk_count": 0,
            "error": None
        }

    worker = threading.Thread(
        target=_background_prepare_task,
        args=(clean_id, title, authors, year, category, pdf_url),
        daemon=True
    )
    worker.start()

    return _PROCESSING_TASKS[clean_id]


def get_paper_status(arxiv_id: str) -> Dict[str, Any]:
    """
    Checks whether a paper is available locally, currently processing, or not prepared.
    """
    clean_id = sanitize_arxiv_id(arxiv_id)

    # 1. Check DB first
    existing = find_paper_by_arxiv_id(clean_id)
    if existing:
        count = get_paper_chunks_count(existing["id"])
        return {
            "arxiv_id": clean_id,
            "status": "completed",
            "progress": "Paper is ready for Q&A.",
            "paper_id": existing["id"],
            "chunk_count": count,
            "error": None
        }

    # 2. Check in-memory status
    with _TASKS_LOCK:
        if clean_id in _PROCESSING_TASKS:
            return _PROCESSING_TASKS[clean_id].copy()

    return {
        "arxiv_id": clean_id,
        "status": "not_prepared",
        "progress": "Paper has not been prepared yet.",
        "paper_id": None,
        "chunk_count": 0,
        "error": None
    }
