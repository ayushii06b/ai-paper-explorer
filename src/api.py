from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import threading

from src.database import get_connection
from src.retrieval import search_similar_chunks
from src.rag import generate_rag_answer, load_model
from src.arxiv_service import search_arxiv, prepare_paper_async, get_paper_status

app = FastAPI(
    title="AI Research Paper Explorer API",
    description="Backend API providing semantic retrieval and RAG question answering over arXiv research papers.",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class QuestionRequest(BaseModel):
    question: str = Field(..., description="Natural language research query", min_length=3)
    top_k: Optional[int] = Field(default=2, description="Number of context chunks to retrieve", ge=1, le=10)
    paper_id: Optional[int] = Field(default=None, description="Optional paper ID to constrain retrieval")
    max_new_tokens: Optional[int] = Field(default=40, description="Max new tokens to generate", ge=10, le=100)


class SourceItem(BaseModel):
    paper: str
    page: int
    similarity: float


class AskResponse(BaseModel):
    question: str
    answer: str
    sources: List[SourceItem]


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
    arxiv_id: str = Field(..., description="arXiv ID of the paper to prepare")
    title: Optional[str] = None
    authors: Optional[str] = None
    year: Optional[int] = None
    category: Optional[str] = None
    pdf_url: Optional[str] = None


class ArxivStatusResponse(BaseModel):
    arxiv_id: str
    status: str
    progress: str
    paper_id: Optional[int] = None
    chunk_count: int = 0
    error: Optional[str] = None


@app.on_event("startup")
def startup_event():
    """Warm up lazy-loaded components (pgvector connection and local LLM)."""
    print("AI Research Paper Explorer API starting up...", flush=True)
    # Warm up LLM in background thread so uvicorn binds port 8000 and serves requests immediately
    t = threading.Thread(target=load_model, daemon=True)
    t.start()


@app.get("/")
def root():
    return {
        "status": "ok",
        "service": "AI Research Paper Explorer API",
        "endpoints": ["/api/health", "/api/papers", "/api/search", "/api/ask"]
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "database": "connected"
    }


@app.get("/api/papers", response_model=List[PaperItem])
def get_papers():
    """Returns all research papers stored in the database with their chunk counts."""
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT p.id, p.title, p.authors, p.year, p.category, p.pdf_path,
                   COUNT(pc.id) as chunk_count,
                   (SELECT pc2.chunk_text FROM paper_chunks pc2 WHERE pc2.paper_id = p.id AND pc2.chunk_index = 0 LIMIT 1) as snippet
            FROM papers p
            LEFT JOIN paper_chunks pc ON p.id = pc.paper_id
            GROUP BY p.id
            ORDER BY p.id;
        """)
        rows = cur.fetchall()
        cur.close()
        conn.close()

        papers = []
        for r in rows:
            snippet_raw = r[7] or ""
            # Clean snippet for display preview
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
        raise HTTPException(status_code=500, detail=f"Failed to fetch papers: {str(e)}")


@app.get("/api/papers/{paper_id}", response_model=PaperItem)
def get_paper_by_id(paper_id: int):
    """Returns a specific research paper by its database ID."""
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT p.id, p.title, p.authors, p.year, p.category, p.pdf_path,
                   COUNT(pc.id) as chunk_count,
                   (SELECT pc2.chunk_text FROM paper_chunks pc2 WHERE pc2.paper_id = p.id AND pc2.chunk_index = 0 LIMIT 1) as snippet
            FROM papers p
            LEFT JOIN paper_chunks pc ON p.id = pc.paper_id
            WHERE p.id = %s
            GROUP BY p.id;
        """, (paper_id,))
        r = cur.fetchone()
        cur.close()
        conn.close()

        if not r:
            raise HTTPException(status_code=404, detail="Paper not found")

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
        raise HTTPException(status_code=500, detail=f"Failed to fetch paper {paper_id}: {str(e)}")


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
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


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
        raise HTTPException(status_code=500, detail=f"RAG processing failed: {str(e)}")


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
        raise HTTPException(status_code=500, detail=f"Paper RAG processing failed: {str(e)}")


@app.get("/api/arxiv/search", response_model=ArxivSearchResponse)
def search_arxiv_endpoint(
    q: str = Query(..., min_length=1, description="Search query by topic, title, author, or arXiv ID"),
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=10, ge=1, le=30, description="Items per page")
):
    """Searches official arXiv API and marks papers already present in the local database."""
    try:
        results = search_arxiv(query=q, page=page, page_size=page_size)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"arXiv search failed: {str(e)}")


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
        raise HTTPException(status_code=500, detail=f"Failed to initiate paper preparation: {str(e)}")


@app.get("/api/arxiv/status/{arxiv_id}", response_model=ArxivStatusResponse)
def get_arxiv_status_endpoint(arxiv_id: str):
    """Checks the preparation and ingestion status of an external arXiv paper."""
    try:
        return get_paper_status(arxiv_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get paper status: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.api:app", host="0.0.0.0", port=8000, reload=True)
