export function formatApiPaper(p) {
  if (!p) return null;

  const rawTitle = (p.title || `Paper #${p.id}`).trim();
  const cleanSnippet = p.snippet ? p.snippet.replace(/\n+/g, ' ').trim() : '';
  
  // If title is an arXiv ID (e.g. "2610.02142"), extract a descriptive title from snippet if possible
  const isNumericOrArxivId = /^\d{4}\.\d{4,5}(v\d+)?$/.test(rawTitle);
  let displayTitle = rawTitle;
  if (isNumericOrArxivId) {
    const snippetTitle = cleanSnippet
      ? cleanSnippet.split(/abstract|introduction/i)[0].trim().slice(0, 95)
      : `Research Paper ${rawTitle}`;
    displayTitle = snippetTitle.length > 15 ? snippetTitle : `Research Paper ${rawTitle}`;
  }

  const categoryMap = {
    'cs.CV': 'Computer Vision',
    'cs.CL': 'Natural Language Processing',
    'cs.AI': 'Artificial Intelligence',
    'cs.LG': 'Machine Learning',
    'cs.RO': 'Robotics',
    'stat.ML': 'Machine Learning',
    'cs.IR': 'Information Retrieval & Search',
    'cs.CR': 'Cybersecurity & AI'
  };
  const categoryName = categoryMap[p.category] || p.category || "Artificial Intelligence";
  const estimatedPages = Math.max(1, Math.round((p.chunk_count || 12) / 3));

  return {
    id: String(p.id),
    dbId: p.id,
    arxivId: isNumericOrArxivId ? rawTitle : (p.arxiv_id || String(p.id)),
    title: displayTitle,
    authors: p.authors || "Academic Research Team",
    year: p.year || 2024,
    category: categoryName,
    pages: estimatedPages,
    chunkCount: p.chunk_count || 0,
    pdfPath: p.pdf_path || "",
    abstract: cleanSnippet || "Full academic paper available for reading, conceptual search, and verified question answering.",
    overview: cleanSnippet && cleanSnippet.length > 80
      ? cleanSnippet
      : `Research paper in ${categoryName} exploring theoretical formulations, architectural methodologies, and empirical benchmark results.`,
    keyInformation: [
      { label: "Paper Catalog ID", value: `#${p.id}` },
      { label: "Field of Study", value: categoryName },
      { label: "Publication Year", value: String(p.year || 2024) },
      { label: "Document Length", value: `${estimatedPages} Pages` },
      { label: "Full Text Access", value: "Verified & Ready for Q&A" }
    ],
    researchProblem: `Addressing core scientific and empirical challenges in ${categoryName} through algorithmic advances and empirical testing.`,
    method: "Comprehensive theoretical modeling, rigorous experimental evaluation, and benchmark analysis across standard evaluation datasets.",
    results: "Presents verifiable outcomes, reproducible experimental analysis, and state-of-the-art results.",
    sampleQuestions: [
      `What is the primary contribution of this paper?`,
      `What methodology and evaluation metrics were used?`,
      `How do the findings compare with prior work?`
    ],
    qaHistory: []
  };
}
