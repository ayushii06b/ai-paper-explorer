# Setup, Configuration & Execution Guide

> **Operating System:** Windows 10/11, Linux, or macOS  
> **Python Version:** 3.10+ (Tested on Python 3.13)  
> **Node.js Version:** 18+ (Tested on Node 22.17)  
> **Database:** PostgreSQL 17 with `pgvector` Extension  

---

## 1. System Prerequisites

1. **Python 3.10 to 3.13:** With `pip` and virtual environment support.
2. **Node.js 18+:** With `npm`.
3. **PostgreSQL 17:** Running on port `5433` (or default `5432` configured in `.env`).
4. **pgvector extension:** Installed into PostgreSQL (`CREATE EXTENSION vector;`).

---

## 2. Environment Configuration

Create a `.env` file in the project root directory based on `.env.example`:

```ini
DB_HOST=localhost
DB_PORT=5433
DB_NAME=ai_paper_explorer
DB_USER=postgres
DB_PASSWORD=your_actual_password_here
```

> [!WARNING]
> Never commit `.env` containing plain-text database credentials to Git. Ensure `.env` is listed in your `.gitignore` file.

---

## 3. Python Environment Setup & Installation

From the project root:

```powershell
# 1. Create a Python virtual environment (optional but recommended)
python -m venv venv
.\venv\Scripts\Activate.ps1

# 2. Install production backend dependencies
pip install -r requirements.txt
```

### Verified Dependencies in `requirements.txt`:
- `pymupdf` (PyMuPDF for PDF text extraction)
- `sentence-transformers` (BGE embedding generation)
- `transformers` & `torch` (Local LLM tokenizer and inference)
- `psycopg2-binary` & `pgvector` (PostgreSQL and vector extension client)
- `python-dotenv` (Loads `.env` variables)
- `fastapi` & `uvicorn` (ASGI REST API server)

---

## 4. Database Setup & Initialization

Run the database initializer to create the database, enable the vector extension, and define tables:

```powershell
python -c "from src.database import init_database; init_database()"
```

> [!NOTE]
> This command creates the `ai_paper_explorer` database and tables (`papers`, `paper_chunks`) if they do not exist. It will **not** delete or overwrite existing data.

---

## 5. Dataset Management & Ingestion

The repository includes a curated collection of 40 research paper PDFs in `Data/papers/` and an on-demand download directory in `Data/downloaded_papers/`.

### Testing Verification (Safe Read-Only Commands)

```powershell
# Verify chunk token limits (<= 400 tokens)
python test_chunking.py

# Verify bibliography stripping
python test_reference_removal.py

# Verify pgvector semantic retrieval across 5 queries
python test_retrieval.py

# Verify grounded RAG generation (requires ~45s per query on CPU)
python test_rag.py
```

### Ingestion Commands (Data Modification Warnings)

> [!CAUTION]
> **Data Reprocessing Warning:** Running `batch_ingestion.py` will iterate through all PDFs in `Data/papers/` and insert duplicates into PostgreSQL if run on an already populated database. Only run this if populating an empty database from scratch!

```powershell
# ONLY RUN IF INITIALIZING A BLANK DATABASE:
# python src/batch_ingestion.py
```

---

## 6. Running the Application (Backend + Frontend)

### Step 1: Start the FastAPI Backend
Start the backend server on port `8000`:

```powershell
python -m uvicorn src.api:app --host 127.0.0.1 --port 8000
```

- **Health Check Endpoint:** `http://127.0.0.1:8000/api/health`
- **Interactive Swagger Docs:** `http://127.0.0.1:8000/docs`

### Step 2: Start the React Frontend
In a separate terminal, navigate to the `frontend/` directory:

```powershell
cd frontend
npm install   # (If first time running)
npx vite --host 127.0.0.1 --port 5173
```

- **Application Web UI:** [http://127.0.0.1:5173/](http://127.0.0.1:5173/)

---

## 7. Component Verification Checklist

| Component | Verification Method | Expected Result |
| :--- | :--- | :--- |
| **PostgreSQL & pgvector** | `python -c "from src.database import get_connection; conn=get_connection(); cur=conn.cursor(); cur.execute('SELECT COUNT(*) FROM papers;'); print('Count:', cur.fetchone()[0])"` | `Count: 41` |
| **FastAPI Backend** | Visit `http://127.0.0.1:8000/api/health` in browser or curl | `{"status":"healthy","database":"connected"}` |
| **arXiv Search API** | `GET http://127.0.0.1:8000/api/arxiv/search?q=1706.03762` | Returns JSON with `Attention Is All You Need`, `is_ingested: true`, `local_paper_id: 93` |
| **Paper-Specific RAG** | `POST http://127.0.0.1:8000/api/papers/93/ask` with `{"question":"What is self-attention?"}` | Returns answer with source citations referencing `Page 3` and `Page 2`. |
| **Frontend Web UI** | Visit `http://127.0.0.1:5173/` | Header displays green pill `"Backend Connected"`, displays library papers, and search works. |
