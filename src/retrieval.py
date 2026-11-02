import os
import time
import numpy as np

# Ensure HuggingFace uses local cache without attempting network calls
os.environ.setdefault("HF_HUB_OFFLINE", "1")
os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")

from pgvector.psycopg2 import register_vector

from src.database import get_connection
from src.model_loader import get_embedding_model


def search_similar_chunks(query, top_k=5, paper_id=None):
    t_start = time.perf_counter()

    # Convert user's question into an embedding via shared singleton
    t_embed_start = time.perf_counter()
    model = get_embedding_model()
    query_embedding = model.encode(
        query,
        normalize_embeddings=True
    )

    query_embedding = np.array(
        query_embedding,
        dtype=np.float32
    )
    t_embed = time.perf_counter() - t_embed_start

    # Connect to PostgreSQL with guaranteed cleanup
    t_db_start = time.perf_counter()
    conn = get_connection()
    try:
        register_vector(conn)
        cursor = conn.cursor()
        try:
            if paper_id is not None:
                sql = """
                    SELECT
                        pc.chunk_id,
                        pc.paper_id,
                        pc.chunk_text,
                        pc.page_number,
                        p.title,
                        1 - (pc.embedding <=> %s) AS similarity
                    FROM paper_chunks pc
                    JOIN papers p
                        ON pc.paper_id = p.id
                    WHERE pc.paper_id = %s
                    ORDER BY pc.embedding <=> %s
                    LIMIT %s;
                """
                cursor.execute(
                    sql,
                    (
                        query_embedding,
                        paper_id,
                        query_embedding,
                        top_k
                    )
                )
            else:
                sql = """
                    SELECT
                        pc.chunk_id,
                        pc.paper_id,
                        pc.chunk_text,
                        pc.page_number,
                        p.title,
                        1 - (pc.embedding <=> %s) AS similarity
                    FROM paper_chunks pc
                    JOIN papers p
                        ON pc.paper_id = p.id
                    ORDER BY pc.embedding <=> %s
                    LIMIT %s;
                """
                cursor.execute(
                    sql,
                    (
                        query_embedding,
                        query_embedding,
                        top_k
                    )
                )

            rows = cursor.fetchall()

            results = []
            for row in rows:
                results.append({
                    "chunk_id": row[0],
                    "paper_id": row[1],
                    "text": row[2],
                    "page": row[3],
                    "title": row[4],
                    "similarity": float(row[5])
                })
        finally:
            cursor.close()
    finally:
        conn.close()

    t_db = time.perf_counter() - t_db_start
    t_total = time.perf_counter() - t_start

    print(
        f"[Retrieval Timing] Embedding: {t_embed:.3f}s | "
        f"pgvector query: {t_db:.3f}s | "
        f"Total: {t_total:.3f}s | "
        f"Retrieved: {len(results)} chunks (paper_id={paper_id}, top_k={top_k})"
    )

    return results
