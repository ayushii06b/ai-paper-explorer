# Repository Directory Structure & Component Analysis

> **Audit Date:** October 2026  
> **Scope:** Entire repository including root files, Python backend (`src/`), data directory (`Data/`), and React client (`frontend/`).

---

## 1. Visual Repository Tree

```text
AI-Paper-Explorer/
├── .env                              # Local PostgreSQL environment credentials
├── .env.example                      # Template environment variable definitions
├── .gitignore                        # Git exclusion rules (PDFs, venvs, caches, .env)
├── download_arxiv.py                 # Batch downloader script for initial 40 arXiv papers
├── LICENSE                           # Project MIT license
├── main.py                           # Original single-paper end-to-end prototype script
├── README.md                         # Project documentation entry point
├── requirements.txt                  # Python production dependencies
├── test_chunking.py                  # Unit test verifying chunk size bounds (<= 400 tokens)
├── test_rag.py                       # Integration test for grounded RAG answer generation
├── test_reference_removal.py         # Unit test verifying regex bibliography trimming
├── test_retrieval.py                 # Retrieval test evaluating pgvector similarity search
│
├── Data/                             # Dataset storage folder
│   ├── arxiv_metadata.csv            # Metadata table for 40 downloaded arXiv papers
│   ├── chunks.json                   # Output from prototype chunking (sample paper)
│   ├── cleaned_pages.json            # Output from prototype cleaning (sample paper)
│   ├── downloaded_papers/            # Directory for on-demand arXiv downloaded PDFs
│   │   └── 1706.03762.pdf            # Sample downloaded paper ("Attention Is All You Need")
│   ├── embedded_chunks.json          # Output from prototype embedding generation
│   ├── papers/                       # Storage for initial 40 research paper PDFs
│   │   ├── 2610.02142.pdf ... (40)
│   └── sample paper.pdf              # Benchmark sample PDF used in initial prototyping
│
├── src/                              # Core Python backend package
│   ├── __init__.py                   # Package initialization marker
│   ├── api.py                        # FastAPI REST API application & routing endpoints
│   ├── arxiv_service.py              # Official arXiv API client, downloader & live pipeline
│   ├── batch_ingestion.py            # Batch ingestion runner for Data/papers/ directory
│   ├── chunking.py                   # Tokenizer-based sliding window document chunking
│   ├── cleaning.py                   # Text cleaning, header/footer & page number removal
│   ├── database.py                   # PostgreSQL connection factory & DDL initialization
│   ├── embedding.py                  # SentenceTransformer embedding wrapper (BGE 768-dim)
│   ├── ingestion.py                  # PyMuPDF text extraction & reference section stripper
│   ├── rag.py                        # Grounded RAG synthesis with LiquidAI LFM2.5 LLM
│   ├── retrieval.py                  # pgvector semantic similarity search implementation
│   └── vector_store.py               # Database CRUD for papers and paper_chunks
│
└── frontend/                         # React 19 + Tailwind v4 + Vite Single Page Application
    ├── index.html                    # Root HTML document mounting React
    ├── package.json                  # Node.js project manifest & dependencies
    ├── package-lock.json             # Locked dependency tree
    ├── vite.config.js                # Vite build configuration (React & Tailwind v4 plugins)
    ├── public/                       # Static assets
    └── src/                          # React application source code
        ├── App.jsx                   # Main application router and global state provider
        ├── main.jsx                  # React application entry point (ReactDOM root)
        ├── index.css                 # Tailwind CSS v4 directives & font configurations
        ├── counter.ts                # [UNUSED] Boilerplate starter from Vite init
        ├── main.ts                   # [UNUSED] Boilerplate starter from Vite init
        ├── style.css                 # [UNUSED] Boilerplate starter from Vite init
        ├── assets/                   # SVG and image assets
        ├── components/               # Reusable UI component library
        │   ├── BookmarkButton.jsx    # Bookmark toggle button with localStorage sync
        │   ├── ChatMessage.jsx       # Chat bubble with grounded page citation badges
        │   ├── EmptyState.jsx        # Fallback view for empty search results/saved papers
        │   ├── LoadingState.jsx      # Animated progress spinner with live elapsed timer
        │   ├── Navbar.jsx            # Top navigation bar with dynamic paper count badge
        │   ├── PaperCard.jsx         # Card component displaying paper metadata & actions
        │   ├── PaperMetadata.jsx     # Detailed specifications table for paper details view
        │   ├── SearchBar.jsx         # Debounced search input field with icon
        │   └── SourceCard.jsx        # Grounded citation card showing similarity score
        ├── data/
        │   └── mockPapers.js         # Curated client metadata & categories fallback catalog
        ├── pages/                    # Route-level view components
        │   ├── HomePage.jsx          # Hero section, feature highlights, quick search links
        │   ├── PaperDetailsPage.jsx  # Detailed tabbed paper overview & specifications
        │   ├── PaperQAPage.jsx       # Paper-specific grounded RAG chat session interface
        │   ├── SavedPapersPage.jsx   # Personal reading list persisted in localStorage
        │   └── SearchResultsPage.jsx # Dual-tab search (Local Library vs arXiv Global Explorer)
        └── utils/
            └── paperAdapter.js       # Adapter normalizing FastAPI responses for React state
```

---

## 2. Detailed Component Analysis (File by File)

### Root Files

#### `main.py`
- **Location:** `main.py`
- **Purpose:** Standalone script developed during the initial prototype phase to verify the end-to-end pipeline on a single PDF (`Data/sample paper.pdf`).
- **Inputs:** `Data/sample paper.pdf`
- **Outputs:** `Data/cleaned_pages.json`, `Data/chunks.json`, `Data/embedded_chunks.json`, and records inserted into the database.
- **Used By:** Developer manual execution for sanity-checking.
- **Status:** **Prototype / Reference**. Fully functional for single-file testing, but superseded by `batch_ingestion.py` for multi-paper processing and `arxiv_service.py` for live on-demand ingestion.

#### `download_arxiv.py`
- **Location:** `download_arxiv.py`
- **Purpose:** Batch downloads 40 recent AI/ML research papers from the official arXiv Atom API matching query `cat:cs.AI OR cat:cs.LG OR cat:cs.CL OR cat:cs.CV`.
- **Inputs:** arXiv Atom API endpoint (`http://export.arxiv.org/api/query`).
- **Outputs:** 40 PDF files saved into `Data/papers/` and an index table `Data/arxiv_metadata.csv`.
- **Status:** **Complete**. Ran to populate the baseline 40-paper dataset.

#### `requirements.txt`
- **Location:** `requirements.txt`
- **Purpose:** Declares Python dependencies required for PDF extraction, embedding, database connectivity, vector operations, and the REST API.
- **Contents:**
  - `pymupdf` (PDF extraction)
  - `sentence-transformers`, `transformers`, `torch` (embeddings & local LLM)
  - `psycopg2-binary`, `pgvector` (PostgreSQL connectivity and vector registration)
  - `python-dotenv` (environment variable loading)
  - `fastapi`, `uvicorn` (ASGI web framework)
- **Status:** **Complete & Verified**.

#### `.env` & `.env.example`
- **Location:** `.env` and `.env.example`
- **Purpose:** Database connection parameter definitions (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`).
- **Status:** **Complete**. `.env` is properly ignored by git.

#### Root Test Files (`test_*.py`)
- `test_chunking.py`: Asserts that chunk token counts from a sample PDF never exceed 400 tokens.
- `test_reference_removal.py`: Verifies that bibliography sections are correctly detected and stripped without altering preceding page text.
- `test_retrieval.py`: Executes 5 benchmark queries against `paper_chunks` and prints top-3 similarity matches with page numbers.
- `test_rag.py`: Evaluates `generate_rag_answer()` across 5 questions, including an out-of-domain sanity test.
- **Status:** **Complete & Verified**.

---

### Backend Package (`src/`)

#### `src/database.py`
- **Purpose:** Database connection management and DDL table creation.
- **Key Functions:**
  - `get_connection(db_name=None)`: Returns an active `psycopg2` connection configured from `.env`.
  - `init_database()`: Connects to maintenance DB `postgres`, creates database `ai_paper_explorer` if missing, activates `CREATE EXTENSION IF NOT EXISTS vector;`, registers pgvector, and creates `papers` and `paper_chunks` tables with B-tree indexes.
- **Used By:** `vector_store.py`, `retrieval.py`, `api.py`, `arxiv_service.py`.
- **Status:** **Complete & Verified**.

#### `src/ingestion.py`
- **Purpose:** Low-level PDF parsing and bibliography section removal.
- **Key Functions:**
  - `extract_pdf(pdf_path)`: Uses `fitz.open()` (PyMuPDF) to iterate through pages and extract plain text.
  - `remove_references(pages)`: Locates reference headings (`references`, `bibliography`, etc.) and truncates text at the detected line, discarding subsequent reference pages.
- **Used By:** `main.py`, `batch_ingestion.py`, `arxiv_service.py`.
- **Status:** **Complete & Verified**.

#### `src/cleaning.py`
- **Purpose:** Text normalization and repetitive artifact removal.
- **Key Functions:**
  - `find_repeated_lines(pages, threshold=0.5)`: Identifies header and footer lines appearing on $\ge 50\%$ of pages.
  - `remove_repeated_lines(text, repeated_lines)`: Strips matched header/footer lines.
  - `remove_page_numbers(text)`: Strips standalone numeric lines via regex `^\s*\d+\s*$`.
- **Used By:** `main.py`, `batch_ingestion.py`, `arxiv_service.py`.
- **Status:** **Complete & Verified**.

#### `src/chunking.py`
- **Purpose:** Token-aware document chunking using the exact model vocabulary.
- **Key Functions:**
  - `count_tokens(text)`: Encodes text using `AutoTokenizer.from_pretrained("BAAI/bge-base-en-v1.5")`.
  - `split_text_by_tokens(text, max_tokens=400, overlap_tokens=50)`: Splits token lists using a sliding window and decodes back to text.
  - `chunk_document(pages)`: Orchestrates document-level chunking while preserving 1-based page numbers.
- **Used By:** `main.py`, `batch_ingestion.py`, `arxiv_service.py`.
- **Status:** **Complete & Verified**.

#### `src/embedding.py`
- **Purpose:** Generates dense embeddings for chunks.
- **Key Functions:**
  - `embed_chunks(chunks)`: Encodes chunk texts using `SentenceTransformer("BAAI/bge-base-en-v1.5")` with `normalize_embeddings=True`, returning 768-dimensional float lists.
- **Used By:** `main.py`, `batch_ingestion.py`, `arxiv_service.py`.
- **Status:** **Complete & Verified**.

#### `src/vector_store.py`
- **Purpose:** Database operations for storing and querying paper metadata and chunks.
- **Key Functions:**
  - `insert_paper(...)`: Inserts a paper record and returns the assigned `id`.
  - `insert_chunks(paper_id, chunks)`: Batch inserts chunk text, page numbers, indices, and vector embeddings using `cursor.executemany()`.
  - `find_paper_by_arxiv_id(arxiv_id)`: Checks for paper presence by arXiv ID or base ID.
  - `get_paper_chunks_count(paper_id)`: Counts stored chunks for a paper.
  - `verify_embeddings(paper_id)`: Fetches sample embedding dimensions and sample values.
- **Used By:** `main.py`, `batch_ingestion.py`, `arxiv_service.py`, `api.py`.
- **Status:** **Complete & Verified**.

#### `src/batch_ingestion.py`
- **Purpose:** Automated batch ingestion script for all PDFs in `Data/papers/`.
- **Workflow:** For each PDF: `extract_pdf` $\to$ `remove_references` $\to$ `find_repeated_lines` $\to$ `clean_text` $\to$ `chunk_document` $\to$ `embed_chunks` $\to$ `insert_paper` $\to$ `insert_chunks`.
- **Status:** **Complete & Verified**. Ingested the initial 40 papers into PostgreSQL.

#### `src/retrieval.py`
- **Purpose:** Dense vector retrieval using pgvector cosine distance.
- **Key Functions:**
  - `search_similar_chunks(query, top_k=5, paper_id=None)`: Encodes query via BGE-base (offline cached), executes SQL query with `pc.embedding <=> query_embedding`, joins `papers` table, and returns chunks sorted by cosine similarity (`1 - distance`). Supports paper isolation via optional `paper_id` parameter.
- **Used By:** `rag.py`, `api.py`.
- **Status:** **Complete & Verified**.

#### `src/rag.py`
- **Purpose:** Grounded question answering synthesis using a local LLM.
- **Key Functions:**
  - `load_model()`: Thread-safe singleton loader for `LiquidAI/LFM2.5-1.2B-Instruct` using `torch.bfloat16` and `_model_lock`.
  - `construct_context(chunks, max_chunk_chars=450)`: Formats chunks with paper titles and page numbers, truncating long passages to prevent CPU prefill bottlenecks.
  - `generate_rag_answer(question, top_k=2, paper_id=None, max_new_tokens=40)`: Executes full RAG pipeline: retrieves chunks, validates similarity threshold ($\ge 0.58$), constructs prompt, executes serialized generation under `_generate_lock`, decodes answer, and maps source citations.
- **Used By:** `api.py`.
- **Status:** **Complete & Verified**.

#### `src/arxiv_service.py`
- **Purpose:** Official arXiv API client, rate-limited request manager, safe PDF downloader, and on-demand ingestion worker.
- **Key Functions:**
  - `search_arxiv(query, page=1, page_size=10)`: Queries arXiv Atom feed, parses entries, enforces 2.5s rate-limit interval, checks query cache, and cross-references local PostgreSQL database to flag ingested papers.
  - `prepare_paper_async(...)`: Initiates asynchronous background ingestion task.
  - `_ingest_arxiv_worker(...)`: Background thread worker that streams PDF from arXiv, validates file size and PDF magic bytes, extracts, chunks, embeds, and commits to database.
  - `get_paper_status(arxiv_id)`: Returns current status (`processing`, `completed`, `failed`).
- **Used By:** `api.py`.
- **Status:** **Complete & Verified**.

#### `src/api.py`
- **Purpose:** FastAPI REST API backend exposing endpoints for the React client.
- **Endpoints:**
  - `GET /api/health`: Database and service liveness check.
  - `GET /api/papers`: Returns all papers stored in PostgreSQL with chunk counts.
  - `GET /api/papers/{paper_id}`: Returns metadata for a specific paper.
  - `POST /api/search`: Global semantic vector search.
  - `POST /api/ask`: Global grounded RAG question answering.
  - `POST /api/papers/{paper_id}/ask`: Paper-specific isolated RAG question answering.
  - `GET /api/arxiv/search`: Live arXiv search with local ingestion badges.
  - `POST /api/arxiv/prepare`: Initiates background paper preparation.
  - `GET /api/arxiv/status/{arxiv_id}`: Polls ingestion progress.
- **Used By:** React frontend (`frontend/src/`).
- **Status:** **Complete & Verified**.

---

### Frontend Package (`frontend/`)

#### Client Architecture & State Flow
- **Framework:** React 19 Single Page Application bundled with Vite 8 and styled with Tailwind CSS v4.
- **Client Routing:** Handled by `react-router-dom` (v7) with 5 main views:
  - `/` $\to$ `HomePage.jsx`
  - `/search` $\to$ `SearchResultsPage.jsx`
  - `/paper/:id` $\to$ `PaperDetailsPage.jsx`
  - `/paper/:id/ask` $\to$ `PaperQAPage.jsx`
  - `/saved` $\to$ `SavedPapersPage.jsx`
- **State Synchronization:**
  - Global paper catalog fetched on load from `GET /api/papers` in `App.jsx`.
  - Saved papers list persisted in browser `localStorage` under key `ai_explorer_saved_papers`.
  - Live background polling for paper preparation status using `setInterval` in `SearchResultsPage.jsx`.

---

## 3. Component Interdependency Matrix

| Component | Depends On (Calls) | Called By (Used By) | Data Exchanged |
| :--- | :--- | :--- | :--- |
| `src/database.py` | PostgreSQL server (`psycopg2`), `.env` | `vector_store.py`, `retrieval.py`, `api.py`, `arxiv_service.py` | Connection objects, SQL execution |
| `src/ingestion.py` | `fitz` (PyMuPDF) | `batch_ingestion.py`, `main.py`, `arxiv_service.py` | File paths $\to$ Page text dicts |
| `src/cleaning.py` | `re`, `collections.Counter` | `batch_ingestion.py`, `main.py`, `arxiv_service.py` | Raw text $\to$ Cleaned text without headers |
| `src/chunking.py` | `transformers` (BGE tokenizer) | `batch_ingestion.py`, `main.py`, `arxiv_service.py` | Page text $\to$ 400-token chunks with overlap |
| `src/embedding.py` | `sentence_transformers` | `batch_ingestion.py`, `main.py`, `arxiv_service.py` | Chunk text $\to$ 768-dim float embeddings |
| `src/vector_store.py` | `src/database.py`, `pgvector` | `batch_ingestion.py`, `main.py`, `arxiv_service.py`, `api.py` | Papers & chunks $\to$ PostgreSQL rows |
| `src/retrieval.py` | `src/database.py`, BGE model | `src/rag.py`, `src/api.py`, `test_retrieval.py` | Natural query $\to$ Top-k similar chunks |
| `src/rag.py` | `src/retrieval.py`, LiquidAI model | `src/api.py`, `test_rag.py` | Query + Chunks $\to$ Grounded answer + Sources |
| `src/arxiv_service.py` | arXiv API, `ingestion`, `chunking`, `embedding`, `vector_store` | `src/api.py` | arXiv ID $\to$ Downloaded & indexed paper |
| `src/api.py` | `src/database.py`, `retrieval.py`, `rag.py`, `arxiv_service.py` | React frontend (`App.jsx`, `PaperQAPage.jsx`, etc.) | JSON REST Requests $\leftrightarrow$ Responses |

---

## 4. Audit of Unused Files, Duplicates & Technical Debt

1. **Vite Starter Boilerplate (Safe to Remove in Future):**
   - `frontend/src/counter.ts`
   - `frontend/src/main.ts`
   - `frontend/src/style.css`
   - `frontend/src/assets/hero.png`
   - `frontend/src/assets/typescript.svg`
   *Finding:* Created automatically during `npm create vite@latest`. The application actually runs through `index.html` $\to$ `main.jsx` $\to$ `App.jsx`. These files are unreferenced by the application.
2. **Prototype JSON Artifacts in `Data/`:**
   - `Data/cleaned_pages.json`
   - `Data/chunks.json`
   - `Data/embedded_chunks.json`
   *Finding:* Intermediate JSON dumps generated by running `main.py` on `sample paper.pdf`. All production data is stored directly in PostgreSQL.
3. **Legacy Ingested Paper Metadata:**
   - For the initial 40 papers in `papers`, `title` was set to the arXiv ID (e.g. `"2610.02142"`), while `authors` and `year` were left as `NULL`. In contrast, on-demand ingested papers (such as Paper 93) store full titles, author lists, and years. The frontend `paperAdapter.js` handles this transparently by synthesizing fallback titles from snippets, but enriching legacy records in PostgreSQL is recommended.
