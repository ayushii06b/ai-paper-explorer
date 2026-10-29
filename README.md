# AI Research Paper Explorer

> An intelligent, full-stack semantic literature exploration and Retrieval-Augmented Generation (RAG) platform backed by **PostgreSQL 17**, **pgvector**, **BAAI/bge-base-en-v1.5**, and local **LiquidAI/LFM2.5-1.2B-Instruct** inference.

---

## 🚀 Key Capabilities

- **Curated Vector Library:** Browse and semantically query 41 peer-reviewed research papers (1,673 chunked passages) indexed in PostgreSQL with 768-dimensional dense vector embeddings.
- **Live arXiv Global Explorer:** Search millions of research papers via the official arXiv API by topic, title, author, or arXiv ID (e.g., `1706.03762`).
- **On-Demand Automated Ingestion:** One-click automated PDF download, text extraction (PyMuPDF), reference stripping, token chunking (BGE tokenizer), and vector persistence.
- **Grounded Paper-Specific Q&A:** Natural language question-answering strictly grounded in retrieved document chunks, featuring exact page-number citations to prevent hallucinations.
- **Modern Responsive Web UI:** Built with React 19, Tailwind CSS v4, Lucide icons, and Vite.

---

## 📚 Complete Project Documentation

Detailed technical documentation and system guides are available in the [`docs/`](docs/) directory:

1. [**Project Overview**](docs/project_overview.md): Mission, problem statement, simple vs. technical concept guide, and end-to-end walkthrough example.
2. [**Folder Structure & Component Analysis**](docs/folder_structure.md): Detailed visual tree, file-by-file audit, interdependency matrix, and dead code identification.
3. [**System Architecture & Data Workflow**](docs/architecture_and_workflow.md): System diagrams and 16-stage execution trace from arXiv download to UI display.
4. [**Database & PostgreSQL Schema**](docs/database_documentation.md): Relational + vector design, verified table DDL, ER diagram, and 6 verified SQL queries with explanations.
5. [**Embeddings & Retrieval Mechanics**](docs/embeddings_and_retrieval.md): Deep dive into `BAAI/bge-base-en-v1.5`, cosine distance (`<=>`), and retrieval noise mitigation.
6. [**Setup, Configuration & Execution**](docs/setup_and_execution.md): Prerequisites, environment setup, database initialization, test commands, and startup steps.
7. [**Implementation Status & Next Steps**](docs/implementation_status_and_next_steps.md): Verified feature catalog, technical audit backlog, and future roadmap.

---

## ⚡ Quick Start

### 1. Backend (FastAPI on Port 8000)
```powershell
# Install Python dependencies
pip install -r requirements.txt

# Start backend server
python -m uvicorn src.api:app --host 127.0.0.1 --port 8000
```
- API Health Check: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)
- Swagger Documentation: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 2. Frontend (React 19 on Port 5173)
```powershell
cd frontend
npm install
npx vite --host 127.0.0.1 --port 5173
```
- Web Application: [http://127.0.0.1:5173/](http://127.0.0.1:5173/)

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 19, Tailwind CSS v4, Vite 8, Lucide React | Modern, responsive SPA client |
| **Backend API** | FastAPI, Uvicorn, Pydantic | Asynchronous REST API layer |
| **Database** | PostgreSQL 17 + `pgvector` extension | Unified relational & vector storage |
| **Embeddings** | `BAAI/bge-base-en-v1.5` (768-dim) | Dense vector semantic representation |
| **Local LLM** | `LiquidAI/LFM2.5-1.2B-Instruct` | Local CPU grounded answer synthesis |
| **Extraction** | PyMuPDF (`fitz`), `transformers` | PDF parsing and subword token chunking |
