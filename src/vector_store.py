import numpy as np
from pgvector.psycopg2 import register_vector
from src.database import get_connection


def insert_paper(title, authors=None, year=None, category=None, pdf_path=""):
    """Inserts a paper record into the papers table and returns its generated ID."""
    conn = get_connection()
    cursor = conn.cursor()

    query = """
        INSERT INTO papers (title, authors, year, category, pdf_path)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id;
    """
    cursor.execute(query, (title, authors, year, category, pdf_path))
    paper_id = cursor.fetchone()[0]

    conn.commit()
    cursor.close()
    conn.close()
    return paper_id


def insert_chunks(paper_id, chunks):
    """Inserts chunk text, page numbers, indices, and vector embeddings into paper_chunks."""
    conn = get_connection()
    register_vector(conn)
    cursor = conn.cursor()

    query = """
        INSERT INTO paper_chunks (paper_id, chunk_id, chunk_text, page_number, chunk_index, embedding)
        VALUES (%s, %s, %s, %s, %s, %s);
    """

    records = []
    for idx, chunk in enumerate(chunks):
        embedding_val = np.array(chunk["embedding"], dtype=np.float32)
        records.append((
            paper_id,
            chunk["chunk_id"],
            chunk["text"],
            chunk["page"],
            idx,
            embedding_val
        ))

    cursor.executemany(query, records)
    conn.commit()

    cursor.close()
    conn.close()
    print(f"Successfully inserted {len(chunks)} chunks into paper_chunks for paper_id={paper_id}.")


def get_paper_chunks_count(paper_id):
    """Returns the total number of chunks stored for a paper."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM paper_chunks WHERE paper_id = %s;", (paper_id,))
    count = cursor.fetchone()[0]

    cursor.close()
    conn.close()
    return count


def verify_embeddings(paper_id):
    """
    Verifies that embeddings are stored properly in PostgreSQL and returns sample record details.
    """
    conn = get_connection()
    register_vector(conn)
    cursor = conn.cursor()

    # Query total count and sample vector values
    cursor.execute("""
        SELECT chunk_id, page_number, chunk_index, length(chunk_text), embedding
        FROM paper_chunks
        WHERE paper_id = %s
        ORDER BY chunk_index ASC
        LIMIT 3;
    """, (paper_id,))

    rows = cursor.fetchall()
    samples = []
    for row in rows:
        c_id, page, c_idx, text_len, emb = row
        emb_arr = np.array(emb, dtype=np.float32)
        samples.append({
            "chunk_id": c_id,
            "page_number": page,
            "chunk_index": c_idx,
            "text_length": text_len,
            "embedding_dim": len(emb_arr),
            "sample_vector_values": emb_arr[:5].tolist()
        })

    cursor.close()
    conn.close()
    return samples
