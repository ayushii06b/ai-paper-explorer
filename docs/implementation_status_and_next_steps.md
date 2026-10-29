# Implementation Status, Audit Findings & Roadmap

> **Audit Date:** October 2026  
> **Status:** Category A (Core Platform Operational), Category B (Minor Optimization Items), Category C (Future Roadmap)

---

## 1. Feature Status Classification

### Category A: Implemented and Verified

Every item in this list has been verified through direct code inspection, database execution, and automated test passes:

| Feature / Capability | Evidence (File & Function) | Verification Result |
| :--- | :--- | :--- |
| **PDF Extraction & Page Tracking** | `src/ingestion.py` $\to$ `extract_pdf()` | Successfully extracted text and 1-based page numbers across 41 research PDFs using PyMuPDF. |
| **Bibliography Stripping** | `src/ingestion.py` $\to$ `remove_references()` | Slices text before reference headers; verified in `test_reference_removal.py`. |
| **Header/Footer & Noise Cleaning** | `src/cleaning.py` $\to$ `find_repeated_lines()`, `clean_text()` | Strips recurring conference headers ($\ge 50\%$ occurrence) and isolated page counters. |
| **BGE Token-Based Chunking** | `src/chunking.py` $\to$ `chunk_document()` | 400 token ceiling and 50-token overlap verified via `test_chunking.py` (largest chunk $\le 400$). |
| **BGE 768-Dim Dense Embeddings** | `src/embedding.py` $\to$ `embed_chunks()` | Encodes text with `BAAI/bge-base-en-v1.5` normalized to unit length. Verified 768 dimensions in DB. |
| **PostgreSQL 17 + pgvector Storage** | `src/database.py`, `src/vector_store.py` | 41 papers and 1,673 chunks stored in `papers` and `paper_chunks` with `vector(768)` type. |
| **pgvector Cosine Retrieval** | `src/retrieval.py` $\to$ `search_similar_chunks()` | Verified with `test_retrieval.py` and API tests. Query takes $\approx 15\text{ ms}$. |
| **Paper-Specific Retrieval Isolation** | `src/retrieval.py` (`WHERE pc.paper_id = %s`) | Verified in `test_system.py` on Paper 93; strictly retrieves chunks from the specified paper. |
| **Local LLM Grounded Synthesis** | `src/rag.py` $\to$ `generate_rag_answer()` | Local `LiquidAI/LFM2.5-1.2B-Instruct` generates 2-sentence grounded answers with page citations. |
| **Offline HF Hub Optimization** | `src/rag.py`, `src/retrieval.py` (`HF_HUB_OFFLINE=1`) | Eliminates 30s+ network probe hanging on startup; loads cached weights in $<1\text{ s}$. |
| **Inference CPU Concurrency Locks** | `src/rag.py` (`_model_lock`, `_generate_lock`) | Prevents CPU thread thrashing and memory exhaustion during parallel queries. |
| **Official arXiv Search API** | `src/arxiv_service.py` $\to$ `search_arxiv()` | Live Atom XML search by topic, author, title, and ID; verified with rate limiting and query cache. |
| **On-Demand arXiv Ingestion** | `src/arxiv_service.py` $\to$ `prepare_paper_async()` | Safely downloads external PDF, extracts, chunks, embeds, and indexes into PostgreSQL. Tested on Paper 93. |
| **FastAPI REST API Layer** | `src/api.py` (9 endpoints) | All 9 endpoints (`/api/health`, `/papers`, `/search`, `/ask`, `/arxiv/*`) respond with HTTP 200. |
| **React 19 + Tailwind v4 Client** | `frontend/src/` | SPA with Library, arXiv Search, Paper Details, Saved Papers, and Q&A chat. Builds with 0 errors. |
| **Client Grounded Q&A Chat** | `frontend/src/pages/PaperQAPage.jsx` | Includes 90s timeout, elapsed seconds counter, error banners, and guaranteed loading reset. |

---

### Category B: Present in Code but Needs Optimization / Enrichment

| Item | File Location | Current State & Impact |
| :--- | :--- | :--- |
| **Metadata for Initial 40 Papers** | PostgreSQL `papers` table | For papers 53–92, `title` holds the arXiv ID (e.g. `'2610.02142'`), while `authors` and `year` are `NULL`. The frontend synthesizes titles from text snippets, but enriching the DB from `Data/arxiv_metadata.csv` would be cleaner. |
| **Vite Starter Scaffolding Files** | `frontend/src/counter.ts`, `main.ts`, etc. | Unused boilerplate artifacts left over from `npm create vite`. Does not affect build, but adds clutter. |

---

### Category C: Planned Future Enhancements (Not Yet Implemented)

| Feature | Description | Architecture / Implementation Strategy |
| :--- | :--- | :--- |
| **HNSW Vector Indexing** | Approximate Nearest Neighbor index for scaling to 100,000+ papers. | Execute `CREATE INDEX ON paper_chunks USING hnsw (embedding vector_cosine_ops);`. Currently unnecessary for 1,673 chunks where exact scan takes 15ms. |
| **GGUF / llama.cpp LLM Quantization** | Replacing PyTorch 1.2B bfloat16 CPU generation with 4-bit quantized GGUF weights. | Would reduce local inference time from $\approx 50\text{ s}$ down to $\approx 3-5\text{ s}$ on standard consumer CPUs. |
| **Multi-Paper Comparative Synthesis** | Asking queries comparing two or three selected papers side-by-side. | Extend `QuestionRequest` schema with `paper_ids: List[int]` and update SQL with `WHERE pc.paper_id = ANY(%s)`. |
| **Conversation Thread Export** | Exporting a paper Q&A session as a PDF or Markdown summary. | Client-side export button in `PaperQAPage.jsx` generating formatted Markdown or PDF. |

---

## 2. Prioritized Technical Issues & Recommendations

### Priority 1: High (Performance Optimization)
- **Issue:** CPU LLM Generation Latency on Low-Resource Machines.
  - **Evidence:** `LiquidAI/LFM2.5-1.2B-Instruct` generates at $\approx 0.7\text{ tokens/sec}$ on Windows CPU without GPU acceleration. Generating 40 tokens takes $\approx 50-60\text{ s}$.
  - **Mitigation Currently Implemented:** Prompt truncation (`max_chunk_chars=450`), token capping (`max_new_tokens=25-40`), and frontend 90s timeout with live progress feedback.
  - **Recommended Next Step:** Integrate `llama-cpp-python` with 4-bit quantization (Q4_K_M) to achieve $15+\text{ tok/sec}$ CPU generation.

### Priority 2: Medium (Data Quality)
- **Issue:** Legacy Ingested Papers Lack Author & Year Metadata in Database.
  - **Evidence:** `SELECT id, title, authors FROM papers WHERE id=53;` returns `(53, '2610.02142', NULL)`.
  - **Impact:** Frontend displays `"arXiv Research Team"` and year `2026` for legacy papers.
  - **Recommended Next Step:** Run a one-time enrichment migration script reading `Data/arxiv_metadata.csv` to populate `title`, `authors`, and `year` for IDs 53–92.

### Priority 3: Low (Code Cleanup)
- **Issue:** Unused Starter Files in Frontend.
  - **Evidence:** `frontend/src/main.ts`, `counter.ts`, `style.css`.
  - **Impact:** Minor repository clutter with no runtime impact.
  - **Recommended Next Step:** Remove unused boilerplate files during future frontend maintenance.
