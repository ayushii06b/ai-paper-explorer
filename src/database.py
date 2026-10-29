import os
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from dotenv import load_dotenv
from pgvector.psycopg2 import register_vector

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5433")
DB_NAME = os.getenv("DB_NAME", "ai_paper_explorer")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")


def get_connection(db_name=None):
    """
    Establishes a connection to the specified PostgreSQL database.
    Prioritizes DATABASE_URL if set (cloud/hosted environment),
    falling back to discrete DB_* settings (local development).
    """
    database_url = os.getenv("DATABASE_URL")
    if database_url and not db_name:
        return psycopg2.connect(database_url)

    target_db = db_name if db_name else DB_NAME
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=target_db,
        user=DB_USER,
        password=DB_PASSWORD
    )
    return conn


def init_database():
    """
    Creates the project database if it does not exist, registers the vector extension,
    and sets up tables for papers and paper_chunks.
    """
    # 1. Connect to maintenance DB 'postgres' to ensure ai_paper_explorer exists
    main_conn = get_connection(db_name="postgres")
    main_conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = main_conn.cursor()

    cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s;", (DB_NAME,))
    exists = cursor.fetchone()
    if not exists:
        print(f"Database '{DB_NAME}' does not exist. Creating...")
        cursor.execute(f'CREATE DATABASE "{DB_NAME}";')
        print(f"Database '{DB_NAME}' created successfully.")
    else:
        print(f"Database '{DB_NAME}' already exists.")

    cursor.close()
    main_conn.close()

    # 2. Connect to ai_paper_explorer and create extension and tables
    conn = get_connection(db_name=DB_NAME)
    conn.autocommit = True
    cursor = conn.cursor()

    # Enable pgvector extension
    cursor.execute("CREATE EXTENSION IF NOT EXISTS vector;")
    register_vector(conn)

    # Table: papers
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS papers (
            id SERIAL PRIMARY KEY,
            arxiv_id VARCHAR(100),
            title VARCHAR(500) NOT NULL,
            authors TEXT,
            year INT,
            category VARCHAR(100),
            pdf_path TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
    """)
    cursor.execute("ALTER TABLE papers ADD COLUMN IF NOT EXISTS arxiv_id VARCHAR(100);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_papers_arxiv_id ON papers(arxiv_id);")

    # Table: paper_chunks
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS paper_chunks (
            id SERIAL PRIMARY KEY,
            paper_id INT NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
            chunk_id INT NOT NULL,
            chunk_text TEXT NOT NULL,
            page_number INT NOT NULL,
            chunk_index INT NOT NULL,
            embedding vector(768) NOT NULL,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
    """)

    # Index on paper_id
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_paper_chunks_paper_id ON paper_chunks(paper_id);
    """)

    cursor.close()
    conn.close()
    print("Database schema initialized successfully.")
