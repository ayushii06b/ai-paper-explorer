import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Filter,
  SlidersHorizontal,
  BookOpen,
  Sparkles,
  MessageSquare,
  Globe,
  ExternalLink,
  FileText,
  CheckCircle2,
  Loader2,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  Tag,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import SearchBar from '../components/SearchBar';
import PaperCard from '../components/PaperCard';
import EmptyState from '../components/EmptyState';
import { MOCK_PAPERS, MOCK_CATEGORIES, MOCK_YEARS } from '../data/mockPapers';
import { API_BASE_URL } from '../config/api';

export default function SearchResultsPage({ papers, savedPaperIds, onToggleSave }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const tabParam = searchParams.get('tab') || 'local';
  const initialQuery = searchParams.get('q') || '';

  const [activeTab, setActiveTab] = useState(tabParam === 'arxiv' ? 'arxiv' : 'local');
  const [query, setQuery] = useState(initialQuery);

  // Sync activeTab if URL changes
  useEffect(() => {
    const currentTab = searchParams.get('tab') || 'local';
    setActiveTab(currentTab === 'arxiv' ? 'arxiv' : 'local');
    if (searchParams.get('q') !== null) {
      setQuery(searchParams.get('q'));
    }
  }, [searchParams]);

  // Tab change handler
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    const newParams = {};
    if (query.trim()) newParams.q = query.trim();
    if (newTab === 'arxiv') newParams.tab = 'arxiv';
    setSearchParams(newParams);
  };

  const handleSearchSubmit = (newQuery) => {
    const newParams = {};
    if (newQuery.trim()) newParams.q = newQuery.trim();
    if (activeTab === 'arxiv') newParams.tab = 'arxiv';
    setSearchParams(newParams);
  };

  // ==========================================
  // LOCAL LIBRARY SEARCH STATE
  // ==========================================
  const paperList = papers && papers.length > 0 ? papers : MOCK_PAPERS;
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedYear, setSelectedYear] = useState('All Years');
  const [sortBy, setSortBy] = useState('relevance');
  const [vectorResults, setVectorResults] = useState([]);
  const [isSearchingVector, setIsSearchingVector] = useState(false);

  // Dynamically compute unique categories from live papers
  const availableCategories = useMemo(() => {
    const cats = new Set(['All Categories']);
    ['Natural Language Processing', 'Computer Vision', 'Artificial Intelligence', 'Machine Learning', 'Information Retrieval & RAG', 'Robotics'].forEach((c) =>
      cats.add(c)
    );
    paperList.forEach((paper) => {
      if (paper.category) cats.add(paper.category);
    });
    return Array.from(cats);
  }, [paperList]);

  // Dynamically compute unique years from live papers
  const availableYears = useMemo(() => {
    const yrs = new Set(['All Years']);
    paperList.forEach((paper) => {
      if (paper.year) yrs.add(String(paper.year));
    });
    return Array.from(yrs).sort((a, b) => {
      if (a === 'All Years') return -1;
      if (b === 'All Years') return 1;
      return Number(b) - Number(a);
    });
  }, [paperList]);

  // Perform live dense vector search against FastAPI /api/search when query changes (Local tab)
  useEffect(() => {
    if (activeTab !== 'local' || !query.trim()) {
      setVectorResults([]);
      return;
    }

    let isCurrent = true;
    setIsSearchingVector(true);

    fetch(`${API_BASE_URL}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: query.trim(), top_k: 4 })
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (isCurrent && Array.isArray(data)) {
          setVectorResults(data);
        }
      })
      .catch((err) => {
        console.warn('Backend vector search not reachable:', err);
        if (isCurrent) setVectorResults([]);
      })
      .finally(() => {
        if (isCurrent) setIsSearchingVector(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [query, activeTab]);

  const filteredLocalPapers = useMemo(() => {
    return paperList.filter((paper) => {
      const q = query.toLowerCase().trim();
      const matchesQuery =
        !q ||
        paper.title.toLowerCase().includes(q) ||
        paper.abstract.toLowerCase().includes(q) ||
        paper.authors.toLowerCase().includes(q) ||
        paper.category.toLowerCase().includes(q);

      const matchesCategory =
        selectedCategory === 'All Categories' ||
        paper.category === selectedCategory ||
        (selectedCategory === 'Natural Language Processing' &&
          (paper.category === 'cs.CL' || paper.category === 'Natural Language Processing')) ||
        (selectedCategory === 'Computer Vision' &&
          (paper.category === 'cs.CV' || paper.category === 'Computer Vision')) ||
        (selectedCategory === 'Artificial Intelligence' &&
          (paper.category === 'cs.AI' || paper.category === 'Artificial Intelligence')) ||
        (selectedCategory === 'Machine Learning' &&
          (paper.category === 'cs.LG' || paper.category === 'stat.ML' || paper.category === 'Machine Learning'));

      const matchesYear =
        selectedYear === 'All Years' || String(paper.year) === selectedYear;

      return matchesQuery && matchesCategory && matchesYear;
    }).sort((a, b) => {
      if (sortBy === 'year-desc') return b.year - a.year;
      if (sortBy === 'year-asc') return a.year - b.year;
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return 0; // default relevance order
    });
  }, [paperList, query, selectedCategory, selectedYear, sortBy]);

  // ==========================================
  // ARXIV EXTERNAL SEARCH & PREPARATION STATE
  // ==========================================
  const [arxivPapers, setArxivPapers] = useState([]);
  const [arxivTotal, setArxivTotal] = useState(0);
  const [arxivPage, setArxivPage] = useState(1);
  const [isSearchingArxiv, setIsSearchingArxiv] = useState(false);
  const [arxivWarning, setArxivWarning] = useState(null);
  const [arxivError, setArxivError] = useState(null);

  // Preparation task state tracking: { [arxiv_id]: { status, progress, paper_id, error } }
  const [prepTasks, setPrepTasks] = useState({});
  const pollingIntervals = useRef({});

  const fetchArxivPapers = (searchQ, pageNum = 1) => {
    if (!searchQ.trim()) {
      setArxivPapers([]);
      setArxivTotal(0);
      setArxivWarning(null);
      setArxivError(null);
      return;
    }

    setIsSearchingArxiv(true);
    setArxivError(null);
    setArxivWarning(null);

    const url = `${API_BASE_URL}/api/arxiv/search?q=${encodeURIComponent(searchQ.trim())}&page=${pageNum}&page_size=10`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setArxivPapers(data.papers || []);
        setArxivTotal(data.total_results || 0);
        setArxivWarning(data.warning || null);
      })
      .catch((err) => {
        console.warn('arXiv search error:', err);
        setArxivError('Unable to connect to arXiv search service. Check if backend is online.');
        setArxivPapers([]);
      })
      .finally(() => {
        setIsSearchingArxiv(false);
      });
  };

  useEffect(() => {
    if (activeTab === 'arxiv' && query.trim()) {
      fetchArxivPapers(query, arxivPage);
    }
  }, [activeTab, query, arxivPage]);

  // Cleanup polling intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(pollingIntervals.current).forEach((intervalId) => clearInterval(intervalId));
    };
  }, []);

  const handleStartPrepare = async (paper) => {
    const arxivId = paper.arxiv_id;
    if (!arxivId) return;

    setPrepTasks((prev) => ({
      ...prev,
      [arxivId]: {
        status: 'processing',
        progress: 'Initiating paper download from arXiv...',
        error: null,
        paper_id: null
      }
    }));

    try {
      const response = await fetch(`${API_BASE_URL}/api/arxiv/prepare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          arxiv_id: arxivId,
          title: paper.title,
          authors: paper.authors_str || (paper.authors ? paper.authors.join(', ') : 'arXiv Author'),
          year: paper.year,
          category: paper.category,
          pdf_url: paper.pdf_url
        })
      });

      if (!response.ok) {
        throw new Error(`Preparation failed with status ${response.status}`);
      }

      const initData = await response.json();

      if (initData.status === 'completed' && initData.paper_id) {
        setPrepTasks((prev) => ({
          ...prev,
          [arxivId]: {
            status: 'completed',
            progress: 'Paper ready for Q&A!',
            paper_id: initData.paper_id,
            error: null
          }
        }));
        // Mark paper as ingested in state
        setArxivPapers((prev) =>
          prev.map((p) => (p.arxiv_id === arxivId ? { ...p, is_ingested: true, local_paper_id: initData.paper_id } : p))
        );
        return;
      }

      // Start polling for status
      if (pollingIntervals.current[arxivId]) {
        clearInterval(pollingIntervals.current[arxivId]);
      }

      pollingIntervals.current[arxivId] = setInterval(async () => {
        try {
          const statusRes = await fetch(`${API_BASE_URL}/api/arxiv/status/${encodeURIComponent(arxivId)}`);
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            setPrepTasks((prev) => ({
              ...prev,
              [arxivId]: statusData
            }));

            if (statusData.status === 'completed') {
              clearInterval(pollingIntervals.current[arxivId]);
              delete pollingIntervals.current[arxivId];
              // Update paper item in current list
              setArxivPapers((prev) =>
                prev.map((p) =>
                  p.arxiv_id === arxivId
                    ? { ...p, is_ingested: true, local_paper_id: statusData.paper_id }
                    : p
                )
              );
            } else if (statusData.status === 'failed') {
              clearInterval(pollingIntervals.current[arxivId]);
              delete pollingIntervals.current[arxivId];
            }
          }
        } catch (pollErr) {
          console.warn('Status poll failed:', pollErr);
        }
      }, 1500);
    } catch (err) {
      console.error('Failed to initiate preparation:', err);
      setPrepTasks((prev) => ({
        ...prev,
        [arxivId]: {
          status: 'failed',
          progress: 'Failed to initiate preparation.',
          error: err.message,
          paper_id: null
        }
      }));
    }
  };

  const sampleArxivSuggestions = [
    { label: 'Attention Is All You Need', q: '1706.03762' },
    { label: 'Retrieval Augmented Generation', q: 'retrieval augmented generation' },
    { label: 'Vision Transformers', q: 'vision transformers' },
    { label: 'LoRA Fine-Tuning', q: '2106.09685' },
    { label: 'Deep Residual Learning', q: '1512.03385' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Main Search */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
          <BookOpen className="w-4 h-4" />
          <span>Research Discovery Engine</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">
          Explore Research Papers
        </h1>

        {/* Tab Switcher: Local Library vs arXiv External */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => handleTabChange('local')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'local'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Local Vector Library ({paperList.length})</span>
          </button>

          <button
            onClick={() => handleTabChange('arxiv')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'arxiv'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Globe className="w-4 h-4 text-purple-300" />
            <span>arXiv Global Explorer</span>
            <span className="px-1.5 py-0.2 text-[10px] rounded bg-purple-400/20 text-purple-200 border border-purple-400/30">
              Live API
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="max-w-4xl space-y-2">
          <SearchBar
            value={query}
            onChange={(val) => {
              setQuery(val);
              handleSearchSubmit(val);
            }}
            onSearch={handleSearchSubmit}
            placeholder={
              activeTab === 'arxiv'
                ? 'Search arXiv papers by topic, title, author, or ID (e.g. 1706.03762, RAG)...'
                : 'Search local library by concept, model, or title (e.g. 768-dim, embeddings)...'
            }
          />

          {/* Quick Suggestions for arXiv */}
          {activeTab === 'arxiv' && (
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-slate-500 font-medium">Try arXiv:</span>
              {sampleArxivSuggestions.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(item.q);
                    handleSearchSubmit(item.q);
                  }}
                  className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 hover:border-purple-500/40 text-slate-400 hover:text-purple-300 transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: LOCAL VECTOR LIBRARY CONTENT */}
      {/* ======================================================== */}
      {activeTab === 'local' && (
        <div className="space-y-8">
          {/* Filters Bar */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Category & Year Selectors */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mr-1">
                <Filter className="w-3.5 h-3.5" />
                <span>Filters:</span>
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
              >
                {availableCategories.map((cat, idx) => (
                  <option key={idx} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
              >
                {availableYears.map((yr, idx) => (
                  <option key={idx} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 w-full md:w-auto justify-between md:justify-end">
              <div className="flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Sort By:</span>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
              >
                <option value="relevance">Relevance (Dense Cosine Similarity)</option>
                <option value="year-desc">Newest First</option>
                <option value="year-asc">Oldest First</option>
                <option value="title">Title (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Results Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-sm">
            <span className="text-slate-400">
              Showing <strong className="text-slate-200">{filteredLocalPapers.length}</strong> local research papers
              {query && <span> for "<span className="text-indigo-300">{query}</span>"</span>}
            </span>
            <span className="text-xs text-indigo-400/80 font-mono hidden sm:inline">
              PostgreSQL 17 + pgvector (768-dim)
            </span>
          </div>

          {/* Live pgvector Semantic Matches */}
          {vectorResults.length > 0 && (
            <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>Dense Vector Matches (pgvector + BGE 768-dim)</span>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  Top {vectorResults.length} Chunks
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vectorResults.map((chunk, idx) => (
                  <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-indigo-300">
                        Paper: {chunk.title}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Page {chunk.page}</span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          Sim: {(chunk.similarity * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                      "{chunk.text}"
                    </p>

                    <div className="pt-2 flex justify-end">
                      <Link
                        to={`/paper/${chunk.paper_id}/ask?initialQ=${encodeURIComponent(query)}`}
                        className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium hover:underline"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Ask about this chunk</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Paper Results Grid */}
          {filteredLocalPapers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLocalPapers.map((paper) => (
                <PaperCard
                  key={paper.id}
                  paper={paper}
                  isSaved={savedPaperIds.includes(paper.id)}
                  onToggleSave={onToggleSave}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon="search"
              title={
                selectedCategory !== 'All Categories' || selectedYear !== 'All Years'
                  ? "No papers match selected filter"
                  : "No matching local papers"
              }
              description={
                query
                  ? `No local paper matched "${query}". You can switch to the "arXiv Global Explorer" tab above to search millions of external papers.`
                  : `No paper in your library matched Category: "${selectedCategory}" and Year: "${selectedYear}". Click below to reset filters and view all papers.`
              }
              actionLabel={
                selectedCategory !== 'All Categories' || selectedYear !== 'All Years'
                  ? "Reset Filters (Show All Papers)"
                  : "Search on arXiv Instead"
              }
              actionTo={
                selectedCategory !== 'All Categories' || selectedYear !== 'All Years'
                  ? undefined
                  : `/search?tab=arxiv&q=${encodeURIComponent(query)}`
              }
              onAction={
                selectedCategory !== 'All Categories' || selectedYear !== 'All Years'
                  ? () => {
                      setSelectedCategory('All Categories');
                      setSelectedYear('All Years');
                    }
                  : undefined
              }
            />
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: ARXIV GLOBAL EXPLORER CONTENT */}
      {/* ======================================================== */}
      {activeTab === 'arxiv' && (
        <div className="space-y-6">
          {/* Warning Banner (e.g. rate limit notice with retry) */}
          {arxivWarning && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start justify-between gap-3 text-amber-300 text-xs">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-amber-200">arXiv Notice:</span>
                  <span>{arxivWarning}</span>
                </div>
              </div>
              <button
                onClick={() => fetchArxivPapers(query, arxivPage)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-medium transition-colors shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Error Banner */}
          {arxivError && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-center justify-between gap-3 text-rose-300 text-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{arxivError}</span>
              </div>
              <button
                onClick={() => fetchArxivPapers(query, arxivPage)}
                className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-medium"
              >
                Retry
              </button>
            </div>
          )}

          {/* Search Results Summary Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-sm">
            <span className="text-slate-400">
              {isSearchingArxiv ? (
                <span className="flex items-center gap-2 text-purple-300">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Searching official arXiv database...</span>
                </span>
              ) : (
                <span>
                  Showing <strong className="text-slate-200">{arxivPapers.length}</strong> arXiv papers
                  {query && <span> for "<span className="text-purple-300">{query}</span>"</span>}
                  {arxivTotal > 0 && <span className="text-slate-500"> ({arxivTotal.toLocaleString()} total found)</span>}
                </span>
              )}
            </span>
            <span className="text-xs text-purple-400/80 font-mono hidden sm:inline">
              Official arXiv API Atom Feed
            </span>
          </div>

          {/* External Papers List */}
          {arxivPapers.length > 0 ? (
            <div className="space-y-4">
              {arxivPapers.map((paper) => {
                const task = prepTasks[paper.arxiv_id];
                const isProcessing = task && task.status === 'processing';
                const isCompleted = paper.is_ingested || (task && task.status === 'completed');
                const isFailed = task && task.status === 'failed';
                const effectivePaperId = paper.local_paper_id || (task && task.paper_id);

                return (
                  <div
                    key={paper.arxiv_id}
                    className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-6 space-y-4 transition-all shadow-md"
                  >
                    {/* Top Row: Category, Year, ID & Status Badge */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-semibold">
                          <Tag className="w-3 h-3" />
                          {paper.category}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                          <Calendar className="w-3 h-3" />
                          {paper.year}
                        </span>
                        <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          arXiv:{paper.arxiv_id}
                        </span>
                      </div>

                      {/* Status Badge */}
                      <div>
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>In Library</span>
                          </span>
                        ) : isProcessing ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 text-xs font-semibold animate-pulse">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                            <span>Processing...</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-xs font-medium">
                            <Globe className="w-3.5 h-3.5 text-purple-400" />
                            <span>External arXiv Paper</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg sm:text-xl font-bold text-slate-100 hover:text-purple-300 transition-colors leading-snug">
                      {paper.title}
                    </h3>

                    {/* Authors */}
                    <p className="text-xs sm:text-sm text-slate-400 line-clamp-1">
                      <strong className="text-slate-300">Authors:</strong> {paper.authors_str}
                    </p>

                    {/* Abstract */}
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-serif line-clamp-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                      "{paper.abstract}"
                    </p>

                    {/* Active Ingestion Progress Box */}
                    {isProcessing && (
                      <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-3.5 space-y-2 animate-in fade-in">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-indigo-300 flex items-center gap-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                            {task.progress || 'Preparing paper for Q&A...'}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">BGE Embedding + pgvector</span>
                        </div>
                        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full animate-pulse w-3/4"></div>
                        </div>
                      </div>
                    )}

                    {/* Failed Warning Box */}
                    {isFailed && (
                      <div className="bg-rose-950/40 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300 flex items-center justify-between">
                        <span>Failed: {task.error || 'Could not process PDF.'}</span>
                        <button
                          onClick={() => handleStartPrepare(paper)}
                          className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold"
                        >
                          Retry
                        </button>
                      </div>
                    )}

                    {/* Action Buttons Row */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80">
                      {/* External links */}
                      <div className="flex items-center gap-2 text-xs">
                        {paper.arxiv_url && (
                          <a
                            href={paper.arxiv_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-slate-100 transition-colors"
                          >
                            <span>arXiv Abstract</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </a>
                        )}

                        {paper.pdf_url && (
                          <a
                            href={paper.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-slate-100 transition-colors"
                          >
                            <FileText className="w-3 h-3 text-rose-400" />
                            <span>Official PDF</span>
                          </a>
                        )}
                      </div>

                      {/* Primary Q&A Action Button */}
                      <div>
                        {isCompleted ? (
                          <Link
                            to={`/paper/${effectivePaperId}/ask`}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all active:scale-95"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>Ask This Paper</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        ) : isProcessing ? (
                          <button
                            disabled
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-400 font-semibold text-xs sm:text-sm cursor-not-allowed"
                          >
                            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                            <span>Preparing Document...</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStartPrepare(paper)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition-all active:scale-95"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>Prepare for Q&A</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Pagination Controls */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-800 text-xs text-slate-400">
                <button
                  disabled={arxivPage <= 1 || isSearchingArxiv}
                  onClick={() => setArxivPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <span>Page <strong className="text-slate-200">{arxivPage}</strong></span>

                <button
                  disabled={arxivPapers.length < 10 || isSearchingArxiv}
                  onClick={() => setArxivPage((p) => p + 1)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span>Next Page</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : !isSearchingArxiv ? (
            <EmptyState
              icon="search"
              title={query ? 'No arXiv papers found' : 'Discover research papers on arXiv'}
              description={
                query
                  ? `No external paper matched "${query}". Try searching by another keyword, author name, or arXiv ID like "1706.03762".`
                  : 'Enter a topic, research question, author name, or arXiv ID in the search bar above to query millions of papers from arXiv.'
              }
              actionLabel="Search Attention Papers"
              actionTo="/search?tab=arxiv&q=attention%20is%20all%20you%20need"
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
