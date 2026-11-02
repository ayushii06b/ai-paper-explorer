import os
import threading
from typing import Optional
from sentence_transformers import SentenceTransformer
from transformers import AutoTokenizer

# Ensure HuggingFace loads locally without network delays if cached
os.environ.setdefault("HF_HUB_OFFLINE", "1")
os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")

# Canonical embedding model identifier
MODEL_NAME = "BAAI/bge-base-en-v1.5"

_model: Optional[SentenceTransformer] = None
_tokenizer: Optional[AutoTokenizer] = None
_model_lock = threading.Lock()
_tokenizer_lock = threading.Lock()


def get_embedding_model() -> SentenceTransformer:
    """
    Returns a thread-safe singleton instance of the BAAI/bge-base-en-v1.5
    SentenceTransformer embedding model. Lazily initialized on first access.
    Avoids duplicate in-memory copies across modules.
    """
    global _model

    if _model is not None:
        return _model

    with _model_lock:
        if _model is None:
            print(f"[ModelLoader] Initializing shared embedding model ({MODEL_NAME})...", flush=True)
            try:
                _model = SentenceTransformer(MODEL_NAME, local_files_only=True)
            except Exception:
                _model = SentenceTransformer(MODEL_NAME)
            print("[ModelLoader] Shared embedding model loaded successfully.", flush=True)

    return _model


def get_tokenizer() -> AutoTokenizer:
    """
    Returns a thread-safe singleton instance of the BAAI/bge-base-en-v1.5
    AutoTokenizer. Lazily initialized on first access.
    """
    global _tokenizer

    if _tokenizer is not None:
        return _tokenizer

    with _tokenizer_lock:
        if _tokenizer is None:
            try:
                _tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, local_files_only=True)
            except Exception:
                _tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

    return _tokenizer
