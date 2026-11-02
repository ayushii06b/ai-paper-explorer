# AI Research Paper Explorer - Backend Service
# Compatible with Hugging Face Spaces (16GB RAM Free Tier), Render, and standard Docker hosts.
FROM python:3.11-slim

# Prevent Python from writing .pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=7860
ENV HF_HOME=/tmp/huggingface

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install CPU-optimized PyTorch first for smaller image footprint
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# Copy requirements and install backend dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the BGE embedding model into the image cache to eliminate cold-start latency
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('BAAI/bge-base-en-v1.5')"

# Copy application source code
COPY src/ ./src/
COPY Data/ ./Data/

# Create a non-root user (required by Hugging Face Spaces security sandbox)
RUN useradd -m -u 1000 appuser && \
    mkdir -p /app/Data/downloaded_papers /tmp/huggingface && \
    chown -R appuser:appuser /app /tmp/huggingface

USER appuser

EXPOSE 7860

# Launch Uvicorn on dynamic port (default 7860 for HF Spaces, or $PORT on Render/Cloud)
CMD ["sh", "-c", "uvicorn src.api:app --host 0.0.0.0 --port ${PORT:-7860}"]
