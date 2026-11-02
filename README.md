# AI Research Paper Explorer

> An intelligent, full-stack semantic literature exploration and Retrieval-Augmented Generation (RAG) platform backed by **PostgreSQL**, **pgvector**, **BAAI/bge-base-en-v1.5**, and **Groq Cloud AI**. Built to run at strictly **₹0 hosting cost**.

---

## 📌 Project Overview

**AI Research Paper Explorer** is a full-stack academic research platform designed to help students, developers, and researchers discover, read, and query scientific literature. Traditional keyword search often fails when queries use conceptual synonyms or research terminology. This platform bridges that gap using:

1. **Dense Vector Semantic Search**: Translates user questions into 768-dimensional normalized dense vectors using `BAAI/bge-base-en-v1.5` to find conceptually relevant passages even when keywords do not match.
2. **Grounded RAG Question-Answering**: Synthesizes concise answers strictly citing retrieved paper context passages, including exact page numbers and verbatim excerpts, eliminating hallucinations.
3. **Quota Conservation & Guardrails**: Evaluates vector similarity thresholds to decline out-of-domain questions before calling the LLM, consuming zero external API quota on irrelevant prompts.
4. **On-Demand arXiv Ingestion**: Discovers external research papers via the official arXiv API and ingests them on demand: downloads the PDF, extracts text via PyMuPDF, strips references, normalizes ligatures, token-chunks with offset mapping, embeds, and persists atomically into PostgreSQL.

---

## 🏗️ System Architecture

```mermaid
graph TD
    subgraph Client Tier [Vercel - Free Tier]
        UI[React 19 + Vite SPA<br/>Tailwind CSS v4 • Lucide Icons]
    end

    subgraph API & Compute Tier [Hugging Face Spaces - Free Docker / 16GB RAM]
        API[FastAPI Backend<br/>Uvicorn ASGI Server]
        ModelLoader[Shared Model Loader<br/>Thread-Safe Singleton]
        BGE[BAAI/bge-base-en-v1.5<br/>768-dim Dense Embeddings]
        Pipeline[PDF Extraction • Reference Stripping<br/>Offset-Mapped Token Chunking]
    end

    subgraph Data Tier [Neon PostgreSQL - Free Tier]
        DB[(PostgreSQL 18.6 + pgvector<br/>Papers & Paper Chunks)]
    end

    subgraph Inference Tier [Groq Cloud API - Free Developer Tier]
        Groq[Llama 3.3 70B Versatile<br/>Fallback: Llama 3.1 8B Instant]
    end

    UI -->|HTTPS / REST| API
    API --> ModelLoader
    ModelLoader --> BGE
    API --> Pipeline
    API -->|pgvector Cosine Search <=>| DB
    API -->|Grounded Context Prompt| Groq
```

---

## 🛠️ Technology Stack

| Layer | Component | Description |
| :--- | :--- | :--- |
| **Frontend** | React 19, Tailwind CSS v4, Vite 7, Lucide React, React Router v7 | Modern, responsive dark-mode Single Page Application |
| **Backend API** | FastAPI, Uvicorn, Pydantic v2 | High-performance asynchronous Python REST API layer |
| **Database** | PostgreSQL + `pgvector` extension (Neon Cloud / Local) | Relational paper metadata and 768-dimensional vector storage |
| **Embeddings** | `BAAI/bge-base-en-v1.5` (`sentence-transformers`) | Normalized dense semantic vector representations |
| **Synthesis LLM** | Groq Cloud API (`llama-3.3-70b-versatile` / `llama-3.1-8b-instant`) | Ultra-fast grounded answer synthesis with page citations |
| **PDF Processing** | PyMuPDF (`fitz`), Unicode NFKD, Regex De-hyphenation | Robust text extraction, reference detection, and cleaning |
| **Containerization** | Docker, Python 3.11-slim, CPU-optimized PyTorch | Production image compatible with Hugging Face Spaces & Cloud hosts |

---

## 🚀 Key Features

* **Curated Vector Library**: Browse and semantically query pre-indexed research papers across Machine Learning, Computer Vision, and NLP.
* **arXiv Global Explorer**: Live search over millions of papers from arXiv with instant pagination and duplicate detection.
* **One-Click Ingestion**: Asynchronously downloads paper PDFs, extracts text, removes references, computes embeddings, and stores chunks atomically.
* **Grounded Citations**: Every AI response includes source cards displaying the paper title, page number, chunk index, similarity match percentage, and verbatim excerpt.
* **Pre-Filter Refusal & Anti-Hallucination**: Queries below calibrated similarity thresholds (`0.50` for single-paper Q&A, `0.55` for global corpus) are rejected immediately, protecting against hallucinations and saving LLM quota.
* **Memory-Optimized Shared Loader**: Both query retrieval and document ingestion share a single thread-safe instance of the BGE model in memory, preventing duplicate model loads.
* **Atomic Ingestion**: Ingestion commits paper metadata and vector chunks in a single database transaction, rolling back automatically on failure to prevent orphaned 0-chunk records.

---

## 📋 Environment Configuration

Create a `.env` file in the project root based on [`.env.example`](.env.example). **Never commit real credentials to Git.**

| Variable Name | Required | Description | Example / Default |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Yes (Hosted) | PostgreSQL connection string with `sslmode=require` | `postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require` |
| `DB_HOST` | Local only | Local PostgreSQL host (if `DATABASE_URL` is unset) | `localhost` |
| `DB_PORT` | Local only | Local PostgreSQL port | `5433` |
| `DB_NAME` | Local only | Local database name | `ai_paper_explorer` |
| `DB_USER` | Local only | Local PostgreSQL user | `postgres` |
| `DB_PASSWORD` | Local only | Local PostgreSQL password | `your_password` |
| `GROQ_API_KEY` | Yes | Groq Cloud API key from console.groq.com | `gsk_...` |
| `GROQ_MODEL` | Optional | Primary Groq model for synthesis | `llama-3.3-70b-versatile` |
| `FALLBACK_GROQ_MODEL` | Optional | Fallback model if primary hits rate limit | `llama-3.1-8b-instant` |
| `ALLOWED_ORIGINS` | Optional | Comma-separated CORS allowed domains | `https://your-app.vercel.app,http://localhost:5173` |
| `PORT` | Optional | Port for FastAPI backend service | `8000` (or `7860` for Docker/HF Spaces) |
| `MAX_NEW_TOKENS` | Optional | Maximum new tokens generated per answer | `500` |

---

## 💻 Local Development Setup

### Prerequisites
* Python 3.10, 3.11, or 3.12
* Node.js 18+ and npm
* PostgreSQL with `pgvector` extension (or a free [Neon](https://neon.tech) database)

### 1. Backend Setup
```bash
# Clone the repository
git clone https://github.com/your-username/AI-Paper-Explorer.git
cd AI-Paper-Explorer

# Create and activate Python virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL and GROQ_API_KEY

# Start backend server
python -m uvicorn src.api:app --reload --host 127.0.0.1 --port 8000
```
* API Documentation: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* Health Check: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

### 2. Frontend Setup
```bash
cd frontend

# Install frontend dependencies
npm install

# Start Vite development server
npm run dev
```
* Web Application: [http://localhost:5173](http://localhost:5173)

---

## 📡 REST API Reference

### Health & Metadata
* `GET /`: Service metadata and available route listing.
* `GET /api/health`: Database and service connectivity status.

### Research Papers
* `GET /api/papers`: Lists all ingested papers with chunk counts and text snippets.
* `GET /api/papers/{paper_id}`: Retrieves full details of a specific paper by its database ID.

### Semantic Search & RAG
* `POST /api/search`:
  * **Payload**: `{"question": "...", "top_k": 4, "paper_id": null}`
  * **Response**: List of top similar passage chunks with cosine similarity scores.
* `POST /api/ask`:
  * **Payload**: `{"question": "...", "top_k": 2, "max_new_tokens": 250}`
  * **Response**: `{"question": "...", "answer": "...", "sources": [{"paper": "...", "page": 3, "similarity": 0.78, "text": "..."}]}`
* `POST /api/papers/{paper_id}/ask`:
  * **Payload**: `{"question": "...", "top_k": 2, "max_new_tokens": 250}`
  * **Response**: Scoped grounded answer generated strictly from the specified paper.

### arXiv Catalog & Ingestion
* `GET /api/arxiv/search?q={query}&page=1&page_size=10`: Queries official arXiv API and marks papers already indexed in PostgreSQL.
* `POST /api/arxiv/prepare`: Initiates background download, text extraction, token chunking, and vector embedding for an external arXiv paper.
* `GET /api/arxiv/status/{arxiv_id}`: Polls real-time ingestion progress (`processing`, `completed`, or `failed`).

---

## 🌐 Zero-Budget (₹0) Deployment Guide

### Step 1: Database (Neon PostgreSQL)
1. Create a free account at [Neon](https://neon.tech) (0.5 GB free storage).
2. Create a database named `neondb`.
3. In the Neon SQL Console, run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
4. Copy your `DATABASE_URL` connection string.

### Step 2: Backend (Hugging Face Spaces - Docker)
*Why Hugging Face Spaces?* PyTorch and the BGE embedding model require ~450–550 MB RAM. Render's free tier only offers 512 MB and crashes due to OOM error 137. Hugging Face Spaces offers **16 GB RAM** and 2 vCPU for **₹0**:
1. Create an account at [Hugging Face](https://huggingface.co/).
2. Create a **New Space**, choose **Space SDK: Docker** $\rightarrow$ **Blank**.
3. Under Space **Settings** $\rightarrow$ **Variables and Secrets**, add:
   * `DATABASE_URL`: Your Neon PostgreSQL connection string.
   * `GROQ_API_KEY`: Your Groq API key.
   * `ALLOWED_ORIGINS`: `*` (or your Vercel URL once deployed).
4. Push this repository to your Space. The Space will build using the provided [`Dockerfile`](Dockerfile) and provide a public HTTPS URL:
   `https://<your-username>-<space-name>.hf.space`

### Step 3: Frontend (Vercel)
1. Import this repository into [Vercel](https://vercel.com/).
2. Set **Root Directory** to `frontend`.
3. Under **Environment Variables**, add:
   * `VITE_API_URL`: `https://<your-username>-<space-name>.hf.space`
4. Click **Deploy**. Vercel will build the React SPA with full client-side routing via [`vercel.json`](frontend/vercel.json).

---

## ⚠️ System Limitations & Operational Boundaries

1. **Scanned / Image-Only PDFs**: Text extraction relies on PyMuPDF. PDFs that consist entirely of scanned raster images without an embedded text layer cannot be parsed without an OCR engine like Tesseract.
2. **Groq Free Tier Rate Limits**: Groq's developer free tier provides high throughput (30 requests/min, 14,400 requests/day for Llama 3.1 8B). If the 70B model reaches capacity, the backend automatically fails over to the 8B instant model.
3. **Database Connection Limits**: Neon free tier limits concurrent connections (typically 20). All backend endpoints use strict `try ... finally: conn.close()` blocks to release connections immediately.
4. **Embedding Compute**: Embedding generation for external papers during arXiv ingestion runs on the CPU. A 15-page paper typically takes 10–20 seconds to chunk and embed.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
