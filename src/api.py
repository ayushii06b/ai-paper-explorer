import os
from fastapi import FastAPI, HTTPException, Query, Path
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional

from src.database import get_connection
from src.retrieval import search_similar_chunks
from src.rag import generate_rag_answer
from src.arxiv_service import (
    search_arxiv,
    prepare_paper_async,
    get_paper_status
)


app = FastAPI(
    title="AI Research Paper Explorer API",
    description="Backend API providing semantic retrieval and RAG question answering over arXiv research papers.",
    version="1.0.0"
)


# -----------------------------
# CORS Configuration
# -----------------------------
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "*").strip()
if allowed_origins_env and allowed_origins_env != "*":
    origins = [orig.strip() for orig in allowed_origins_env.split(",") if orig.strip()]
    # Ensure local development hosts are also permitted if needed
    for local_host in ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"]:
        if local_host not in origins:
            origins.append(local_host)
    allow_all = False
else:
    origins = ["*"]
    allow_all = True

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False if allow_all else True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# -----------------------------
# Request and Response Models
# -----------------------------

class QuestionRequest(BaseModel):
    question: str = Field(
        ...,
        description="Natural language research query",
        min_length=3,
        max_length=1000
    )
    top_k: Optional[int] = Field(
        default=2,
        description="Number of context chunks to retrieve",
        ge=1,
        le=10
    )
    paper_id: Optional[int] = Field(
        default=None,
        description="Optional paper ID to constrain retrieval",
        ge=1
    )
    max_new_tokens: int = Field(default=500, ge=10, le=1000)


class SourceItem(BaseModel):
    paper: str
    page: int
    similarity: float
    text: Optional[str] = None
    chunk_id: Optional[int] = None


class AskResponse(BaseModel):
    question: str
    answer: str
    sources: List[SourceItem]
    status: Optional[str] = "success"
    model: Optional[str] = None


class ChunkResult(BaseModel):
    chunk_id: int
    paper_id: int
    text: str
    page: int
    title: str
    similarity: float


class PaperItem(BaseModel):
    id: int
    title: str
    authors: Optional[str] = None
    year: Optional[int] = None
    category: Optional[str] = None
    pdf_path: str
    chunk_count: int
    snippet: Optional[str] = None


class ArxivPaperItem(BaseModel):
    arxiv_id: str
    base_id: str
    title: str
    authors: List[str]
    authors_str: str
    year: int
    published: str
    abstract: str
    category: str
    categories: List[str]
    arxiv_url: str
    pdf_url: str
    is_ingested: bool
    local_paper_id: Optional[int] = None


class ArxivSearchResponse(BaseModel):
    papers: List[ArxivPaperItem]
    total_results: int
    page: int
    page_size: int
    warning: Optional[str] = None
    rate_limited: Optional[bool] = False


class ArxivPrepareRequest(BaseModel):
    arxiv_id: str = Field(
        ...,
        description="arXiv ID of the paper to prepare",
        min_length=3,
        max_length=100
    )
    title: Optional[str] = Field(default=None, max_length=500)
    authors: Optional[str] = Field(default=None, max_length=500)
    year: Optional[int] = Field(default=None, ge=1900, le=2100)
    category: Optional[str] = Field(default=None, max_length=100)
    pdf_url: Optional[str] = Field(default=None, max_length=1000)


class ArxivStatusResponse(BaseModel):
    arxiv_id: str
    status: str
    progress: str
    paper_id: Optional[int] = None
    chunk_count: int = 0
    error: Optional[str] = None


# -----------------------------
# Root Endpoint
# -----------------------------

@app.get("/")
def root():
    return {
        "status": "ok",
        "service": "AI Research Paper Explorer API",
        "endpoints": [
            "/api/health",
            "/api/papers",
            "/api/search",
            "/api/ask",
            "/api/arxiv/search",
            "/api/arxiv/prepare"
        ]
    }


# -----------------------------
# Health Check
# -----------------------------

@app.get("/api/health")
def health_check():
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT 1;")
        cur.fetchone()
        cur.close()

        return {
            "status": "healthy",
            "database": "connected"
        }

    except Exception as e:
        print(f"[Health Check Error] {e}", flush=True)
        raise HTTPException(
            status_code=503,
            detail="Database service currently unavailable."
        )

    finally:
        if conn:
            conn.close()


# -----------------------------
# Get All Papers
# -----------------------------

@app.get("/api/papers", response_model=List[PaperItem])
def get_papers():
    """Returns all research papers stored in the database with their chunk counts."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT
                p.id,
                p.title,
                p.authors,
                p.year,
                p.category,
                p.pdf_path,
                COUNT(pc.id) AS chunk_count,
                (
                    SELECT pc2.chunk_text
                    FROM paper_chunks pc2
                    WHERE pc2.paper_id = p.id
                    AND pc2.chunk_index = 0
                    LIMIT 1
                ) AS snippet
            FROM papers p
            LEFT JOIN paper_chunks pc ON p.id = pc.paper_id
            GROUP BY p.id
            ORDER BY p.id;
        """)

        rows = cur.fetchall()
        cur.close()

        papers = []
        for r in rows:
            snippet_raw = r[7] or ""
            clean_snippet = snippet_raw.strip().replace("\n", " ")[:300]

            papers.append({
                "id": r[0],
                "title": r[1],
                "authors": r[2] or "arXiv Research Team",
                "year": r[3] or 2026,
                "category": r[4] or "Artificial Intelligence",
                "pdf_path": r[5],
                "chunk_count": r[6],
                "snippet": clean_snippet
            })

        return papers

    except Exception as e:
        print(f"[API Error] Failed to fetch papers: {e}", flush=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve research papers."
        )

    finally:
        if conn:
            conn.close()


# -----------------------------
# Get Paper by ID
# -----------------------------

@app.get("/api/papers/{paper_id}", response_model=PaperItem)
def get_paper_by_id(paper_id: int):
    """Returns a specific research paper by its database ID."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT
                p.id,
                p.title,
                p.authors,
                p.year,
                p.category,
                p.pdf_path,
                COUNT(pc.id) AS chunk_count,
                (
                    SELECT pc2.chunk_text
                    FROM paper_chunks pc2
                    WHERE pc2.paper_id = p.id
                    AND pc2.chunk_index = 0
                    LIMIT 1
                ) AS snippet
            FROM papers p
            LEFT JOIN paper_chunks pc ON p.id = pc.paper_id
            WHERE p.id = %s
            GROUP BY p.id;
        """, (paper_id,))

        r = cur.fetchone()
        cur.close()

        if not r:
            raise HTTPException(
                status_code=404,
                detail=f"Research paper with ID {paper_id} not found."
            )

        snippet_raw = r[7] or ""
        clean_snippet = snippet_raw.strip().replace("\n", " ")[:400]

        return {
            "id": r[0],
            "title": r[1],
            "authors": r[2] or "arXiv Research Team",
            "year": r[3] or 2026,
            "category": r[4] or "Artificial Intelligence",
            "pdf_path": r[5],
            "chunk_count": r[6],
            "snippet": clean_snippet
        }

    except HTTPException:
        raise

    except Exception as e:
        print(f"[API Error] Failed to fetch paper {paper_id}: {e}", flush=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve research paper details."
        )

    finally:
        if conn:
            conn.close()


# -----------------------------
# Semantic Search
# -----------------------------

@app.post("/api/search", response_model=List[ChunkResult])
def search_endpoint(payload: QuestionRequest):
    """Semantic vector search endpoint across all papers or a specific paper."""
    try:
        results = search_similar_chunks(
            payload.question,
            top_k=payload.top_k,
            paper_id=payload.paper_id
        )
        return results

    except Exception as e:
        print(f"[API Error] Semantic search failed: {e}", flush=True)
        raise HTTPException(
            status_code=500,
            detail="Semantic search failed due to an internal server error."
        )


# -----------------------------
# RAG Question Answering
# -----------------------------

@app.post("/api/ask", response_model=AskResponse)
def ask_endpoint(payload: QuestionRequest):
    """RAG question answering endpoint across all papers or a specific paper."""
    try:
        response = generate_rag_answer(
            payload.question,
            top_k=payload.top_k or 2,
            paper_id=payload.paper_id,
            max_new_tokens=payload.max_new_tokens
        )
        return response

    except Exception as e:
        print(f"[API Error] RAG processing failed: {e}", flush=True)
        raise HTTPException(
            status_code=500,
            detail="RAG synthesis failed due to an internal server error."
        )


# -----------------------------
# Paper-Specific RAG
# -----------------------------

@app.post("/api/papers/{paper_id}/ask", response_model=AskResponse)
def ask_paper_endpoint(paper_id: int, payload: QuestionRequest):
    """Paper-specific RAG question answering endpoint."""
    try:
        response = generate_rag_answer(
            payload.question,
            top_k=payload.top_k or 2,
            paper_id=paper_id,
            max_new_tokens=payload.max_new_tokens
        )
        return response

    except Exception as e:
        print(f"[API Error] Paper RAG processing failed: {e}", flush=True)
        raise HTTPException(
            status_code=500,
            detail="Paper Q&A synthesis failed due to an internal server error."
        )


# -----------------------------
# arXiv Search
# -----------------------------

@app.get("/api/arxiv/search", response_model=ArxivSearchResponse)
def search_arxiv_endpoint(
    q: str = Query(
        ...,
        min_length=1,
        max_length=200,
        description="Search query by topic, title, author, or arXiv ID"
    ),
    page: int = Query(
        default=1,
        ge=1,
        description="Page number"
    ),
    page_size: int = Query(
        default=10,
        ge=1,
        le=30,
        description="Items per page"
    )
):
    """Searches official arXiv API and marks papers already present in the database."""
    try:
        results = search_arxiv(
            query=q,
            page=page,
            page_size=page_size
        )
        return results

    except Exception as e:
        print(f"[API Error] arXiv search failed: {e}", flush=True)
        raise HTTPException(
            status_code=500,
            detail="arXiv catalog search failed."
        )


# -----------------------------
# Prepare arXiv Paper
# -----------------------------

@app.post("/api/arxiv/prepare", response_model=ArxivStatusResponse)
def prepare_arxiv_endpoint(payload: ArxivPrepareRequest):
    """
    Asynchronously downloads and processes an external arXiv paper:
    extracts text, chunks, embeds with BGE, and stores into PostgreSQL.
    """
    try:
        status_info = prepare_paper_async(
            arxiv_id=payload.arxiv_id,
            title=payload.title or payload.arxiv_id,
            authors=payload.authors,
            year=payload.year,
            category=payload.category,
            pdf_url=payload.pdf_url
        )
        return status_info

    except Exception as e:
        print(f"[API Error] Failed to initiate paper preparation: {e}", flush=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to initiate paper preparation."
        )


# -----------------------------
# arXiv Preparation Status
# -----------------------------

@app.get("/api/arxiv/status/{arxiv_id}", response_model=ArxivStatusResponse)
def get_arxiv_status_endpoint(
    arxiv_id: str = Path(
        ...,
        min_length=1,
        max_length=100,
        description="arXiv ID of the target paper"
    )
):
    """Checks the preparation and ingestion status of an external arXiv paper."""
    try:
        return get_paper_status(arxiv_id)

    except Exception as e:
        print(f"[API Error] Failed to get paper status: {e}", flush=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to check paper preparation status."
        )


# -----------------------------
# Run Locally
# -----------------------------

if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(
        "src.api:app",
        host="0.0.0.0",
        port=port,
        reload=True
    )
