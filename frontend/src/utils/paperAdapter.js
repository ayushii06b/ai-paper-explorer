export function formatApiPaper(p) {
  const cleanSnippet = p.snippet ? p.snippet.replace(/\n+/g, ' ').trim() : '';
  
  // If p.title is an arXiv ID (e.g. "2610.02142"), try to extract a descriptive title from snippet
  const isNumericOrArxivId = /^\d{4}\.\d{4,5}(v\d+)?$/.test(p.title.trim());
  let displayTitle = p.title;
  if (isNumericOrArxivId) {
    const snippetTitle = cleanSnippet
      ? cleanSnippet.split(/abstract|introduction/i)[0].trim().slice(0, 90)
      : `arXiv Paper ${p.title}`;
    displayTitle = snippetTitle.length > 15 ? snippetTitle : `Research Paper ${p.title}`;
  }

  const categoryMap = {
    'cs.CV': 'Computer Vision',
    'cs.CL': 'Natural Language Processing',
    'cs.AI': 'Artificial Intelligence',
    'cs.LG': 'Machine Learning',
    'cs.RO': 'Robotics',
    'stat.ML': 'Machine Learning',
    'cs.IR': 'Information Retrieval & RAG',
    'cs.CR': 'Cybersecurity & AI'
  };
  const categoryName = categoryMap[p.category] || p.category || "Artificial Intelligence";

  return {
    id: String(p.id),
    dbId: p.id,
    arxivId: isNumericOrArxivId ? p.title : (p.arxiv_id || String(p.id)),
    title: displayTitle,
    authors: p.authors || "arXiv Research Team",
    year: p.year || 2026,
    category: categoryName,
    pages: Math.max(1, Math.round(p.chunk_count / 3)),
    chunkCount: p.chunk_count,
    pdfPath: p.pdf_path,
    abstract: cleanSnippet || "Extracted, chunked, and embedded into PostgreSQL 17 pgvector database with BAAI/bge-base-en-v1.5.",
    overview: `arXiv paper ${p.title} with ${p.chunk_count} vector chunks indexed into PostgreSQL 17 with 768-dimensional BGE embeddings for real-time semantic retrieval and RAG question answering.`,
    keyInformation: [
      { label: "Paper ID", value: `#${p.id} (${p.title})` },
      { label: "Vector Chunks", value: `${p.chunk_count} indexed chunks` },
      { label: "Embedding Model", value: "BAAI/bge-base-en-v1.5 (768-dim)" },
      { label: "Vector Storage", value: "PostgreSQL 17 + pgvector (port 5433)" },
      { label: "LLM Backend", value: "LiquidAI/LFM2.5-1.2B-Instruct" }
    ],
    researchProblem: "Addressing foundational machine learning, computer vision, and NLP challenges via dense vector analysis and empirical evaluation.",
    method: "Multi-stage pipeline: PDF extraction (PyMuPDF) -> Reference removal -> Token chunking (400 tokens / 50 overlap) -> BGE embeddings -> pgvector similarity search -> Grounded RAG answer generation.",
    results: `Fully processed and stored in database table paper_chunks across ${p.chunk_count} passages.`,
    sampleQuestions: [
      `What are the core findings of ${p.title}?`,
      `What methodology and experimental setup are described in this paper?`,
      `How does this research compare with prior work?`
    ],
    qaHistory: []
  };
}
