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
  ChevronLeft,
  ChevronRight,
  Search,
  Quote
} from 'lucide-react';
import SearchBar from '../components/SearchBar';
import PaperCard from '../components/PaperCard';
import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';
import { API_BASE_URL } from '../config/api';

export default function SearchResultsPage({
  papers = [],
  isLoading = false,
  backendError = null,
  onRetry,
  savedPaperIds = [],
  onToggleSave
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const tabParam = searchParams.get('tab') || 'local';
  const initialQuery = searchParams.get('q') || '';

  const [activeTab, setActiveTab] = useState(tabParam === 'arxiv' ? 'arxiv' : 'local');
  const [query, setQuery] = useState(initialQuery);

  // Sync activeTab and query if URL changes
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
  // LOCAL LIBRARY STATE & FILTERING
  // ==========================================
  const paperList = papers || [];
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedYear, setSelectedYear] = useState('All Years');
  const [sortBy, setSortBy] = useState('relevance');
  const [passageResults, setPassageResults] = useState([]);
  const [isSearchingPassages, setIsSearchingPassages] = useState(false);

  // Dynamically compute unique categories from live papers
  const availableCategories = useMemo(() => {
    const cats = new Set(['All Categories']);
    ['Natural Language Processing', 'Computer Vision', 'Artificial Intelligence', 'Machine Learning', 'Robotics'].forEach((c) =>
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

  // Perform smart search for passages against FastAPI /api/search when query changes (Library tab)
  useEffect(() => {
    if (activeTab !== 'local' || !query.trim()) {
      setPassageResults([]);
      return;
    }

    let isCurrent = true;
    setIsSearchingPassages(true);

    fetch(`${API_BASE_URL}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: query.trim(), top_k: 4 })
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (isCurrent && Array.isArray(data)) {
          setPassageResults(data);
        }
      })
      .catch((err) => {
        console.warn('Backend search not reachable:', err);
        if (isCurrent) setPassageResults([]);
      })
      .finally(() => {
        if (isCurrent) setIsSearchingPassages(false);
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
        (paper.title && paper.title.toLowerCase().includes(q)) ||
        (paper.abstract && paper.abstract.toLowerCase().includes(q)) ||
        (paper.authors && paper.authors.toLowerCase().includes(q)) ||
        (paper.category && paper.category.toLowerCase().includes(q));

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
      if (sortBy === 'year-desc') return (b.year || 0) - (a.year || 0);
      if (sortBy === 'year-asc') return (a.year || 0) - (b.year || 0);
      if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '');
      return 0; // default order
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
        setArxivError('Unable to connect to the arXiv service. Please verify your backend server is running.');
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
        progress: 'Downloading paper PDF from arXiv...',
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
            progress: 'Paper ready for reading and questions!',
            paper_id: initData.paper_id,
            error: null
          }
        }));
        setArxivPapers((prev) =>
          prev.map((p) => (p.arxiv_id === arxivId ? { ...p, is_ingested: true, local_paper_id: initData.paper_id } : p))
        );
        // Refresh paper list in App if possible
        if (onRetry) onRetry();
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
              setArxivPapers((prev) =>
                prev.map((p) =>
                  p.arxiv_id === arxivId
                    ? { ...p, is_ingested: true, local_paper_id: statusData.paper_id }
                    : p
                )
              );
              if (onRetry) onRetry();
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
    { label: 'Attention Mechanisms', q: 'attention transformer' },
    { label: 'Residual Networks', q: 'deep residual learning' },
    { label: 'Language Models', q: 'large language models' },
    { label: 'Vision Transformers', q: 'vision transformer' },
    { label: 'Model Adaptation', q: 'low-rank adaptation' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header & Main Search */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-teal-400 font-semibold text-xs uppercase tracking-wider">
          <BookOpen className="w-4 h-4" />
          <span>Research Discovery Engine</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
          Explore Research Papers
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
          Search your library collection or discover millions of open-access papers across the arXiv repository.
        </p>

        {/* Search Bar */}
        <div className="pt-2">
          <SearchBar
            value={query}
            onChange={setQuery}
            onSearch={handleSearchSubmit}
            placeholder={
              activeTab === 'arxiv'
                ? "Search millions of papers on arXiv by topic, title, or arXiv ID..."
                : "Search your library by topic, methodology, title, or question..."
            }
            size="lg"
          />
        </div>

        {/* Tab Switcher & Quick Suggestions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="inline-flex p-1 rounded-2xl bg-[#101625] border border-slate-800 self-start">
            <button
              onClick={() => handleTabChange('local')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'local'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Paper Library</span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                activeTab === 'local' ? 'bg-teal-700/60 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {paperList.length}
              </span>
            </button>

            <button
              onClick={() => handleTabChange('arxiv')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'arxiv'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>Discover on arXiv</span>
              <span className="px-1.5 py-0.2 text-[10px] rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Open Access
              </span>
            </button>
          </div>

          {/* Quick topic buttons if in arXiv mode */}
          {activeTab === 'arxiv' && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-slate-400 text-[11px]">Popular:</span>
              {sampleArxivSuggestions.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(item.q);
                    handleSearchSubmit(item.q);
                  }}
                  className="px-2.5 py-1 rounded-full bg-[#101625] border border-slate-800 hover:border-teal-500/40 text-slate-300 hover:text-teal-300 transition-colors text-[11px]"
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: PAPER LIBRARY CONTENT */}
      {/* ======================================================== */}
      {activeTab === 'local' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-[#101625] border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Category & Year Selectors */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mr-1">
                <Filter className="w-3.5 h-3.5 text-teal-400" />
                <span>Filters:</span>
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-[#0b0f19] border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-teal-500"
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
                className="bg-[#0b0f19] border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-teal-500"
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
                className="bg-[#0b0f19] border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-teal-500"
              >
                <option value="relevance">Default Order</option>
                <option value="year-desc">Newest First</option>
                <option value="year-asc">Oldest First</option>
                <option value="title">Title (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Results Summary Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-sm">
            <span className="text-slate-400">
              Showing <strong className="text-slate-100">{filteredLocalPapers.length}</strong> papers in library
              {query && <span> matching "<span className="text-teal-300">{query}</span>"</span>}
            </span>
            <span className="text-xs text-teal-400/80 hidden sm:inline">
              Verified Full-Text Index
            </span>
          </div>

          {/* Smart Passage Matches (when searching) */}
          {passageResults.length > 0 && (
            <div className="bg-[#101625] border border-teal-500/30 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-teal-300 font-semibold text-sm">
                  <Sparkles className="w-4 h-4 text-teal-400" />
                  <span>Key Relevant Passages</span>
                </div>
                <span className="text-xs text-slate-400">
                  {passageResults.length} relevant excerpts found
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {passageResults.map((chunk, idx) => (
                  <div key={idx} className="bg-[#0b0f19] p-4 rounded-xl border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-teal-300 truncate max-w-[220px]">
                        {chunk.title}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-slate-400">Page {chunk.page}</span>
                        <span className="px-2 py-0.5 rounded text-[11px] bg-teal-500/10 text-teal-300 border border-teal-500/30">
                          {chunk.similarity > 0.75 ? "Top Match" : "Relevant"}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 font-serif-quote line-clamp-3 leading-relaxed">
                      "{chunk.text}"
                    </p>

                    <div className="pt-1 flex justify-end">
                      <Link
                        to={`/paper/${chunk.paper_id}/ask?initialQ=${encodeURIComponent(query)}`}
                        className="inline-flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 font-medium hover:underline"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Ask about this passage</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loading Skeleton */}
          {isLoading && (
            <LoadingState type="cards" count={6} />
          )}

          {/* Backend Error State */}
          {!isLoading && backendError && paperList.length === 0 && (
            <div className="bg-[#101625] border border-rose-500/30 rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-slate-100">Unable to Load Paper Library</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  The backend service could not be reached. Please check that your server is running.
                </p>
              </div>
              {onRetry && (
                <div className="pt-2">
                  <button
                    onClick={onRetry}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-md active:scale-95"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Retry Connection</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Paper Results Grid */}
          {!isLoading && filteredLocalPapers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLocalPapers.map((paper) => (
                <PaperCard
                  key={paper.id}
                  paper={paper}
                  isSaved={savedPaperIds.includes(String(paper.id))}
                  onToggleSave={onToggleSave}
                />
              ))}
            </div>
          ) : !isLoading && !backendError ? (
            <EmptyState
              icon="search"
              title={
                selectedCategory !== 'All Categories' || selectedYear !== 'All Years'
                  ? "No papers match your filter"
                  : "No matching papers found"
              }
              description={
                query
                  ? `No paper in your collection matched "${query}". You can switch to the "Discover on arXiv" tab to search millions of external papers.`
                  : `No paper matched Category: "${selectedCategory}" and Year: "${selectedYear}". Click below to reset your filters.`
              }
              actionLabel={
                selectedCategory !== 'All Categories' || selectedYear !== 'All Years'
                  ? "Reset Filters (Show All)"
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
          ) : null}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: ARXIV DISCOVERY CONTENT */}
      {/* ======================================================== */}
      {activeTab === 'arxiv' && (
        <div className="space-y-6">
          {/* Warning Banner */}
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
                <span className="flex items-center gap-2 text-teal-300">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Searching open-access research on arXiv...</span>
                </span>
              ) : (
                <span>
                  Showing <strong className="text-slate-100">{arxivPapers.length}</strong> arXiv papers
                  {query && <span> for "<span className="text-teal-300">{query}</span>"</span>}
                  {arxivTotal > 0 && <span className="text-slate-400"> ({arxivTotal.toLocaleString()} total found)</span>}
                </span>
              )}
            </span>
            <span className="text-xs text-emerald-400/80 hidden sm:inline">
              arXiv Global Repository
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
                    className="bg-[#111726]/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 space-y-4 transition-all shadow-md"
                  >
                    {/* Top Row: Category, Year, ID & Status Badge */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-teal-500/10 text-teal-300 border border-teal-500/20 text-xs font-semibold">
                          <Tag className="w-3 h-3 text-teal-400" />
                          {paper.category}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400 px-2 py-0.5 rounded bg-[#0b0f19] border border-slate-800">
                          <Calendar className="w-3 h-3" />
                          {paper.year}
                        </span>
                        <span className="text-xs font-mono text-slate-400 bg-[#0b0f19] px-2 py-0.5 rounded border border-slate-800">
                          arXiv:{paper.arxiv_id}
                        </span>
                      </div>

                      {/* Status Badge */}
                      <div>
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>In Your Library</span>
                          </span>
                        ) : isProcessing ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/30 text-xs font-semibold animate-pulse">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400" />
                            <span>Adding to Library...</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-xs font-medium">
                            <Globe className="w-3.5 h-3.5 text-teal-400" />
                            <span>Open-Access Research</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-base sm:text-xl font-bold text-slate-100 hover:text-teal-300 transition-colors leading-snug">
                      {paper.title}
                    </h3>

                    {/* Authors */}
                    <p className="text-xs sm:text-sm text-slate-400 line-clamp-1">
                      <strong className="text-slate-300">Authors:</strong> {paper.authors_str}
                    </p>

                    {/* Abstract */}
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-serif-quote line-clamp-3 bg-[#0b0f19]/70 p-3.5 rounded-xl border border-slate-800/80">
                      "{paper.abstract}"
                    </p>

                    {/* Processing Progress Notice */}
                    {isProcessing && (
                      <div className="bg-teal-950/30 border border-teal-500/30 rounded-xl p-3.5 space-y-2 animate-in fade-in">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-teal-300 flex items-center gap-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400" />
                            {task.progress || 'Preparing paper for reading and questions...'}
                          </span>
                          <span className="text-[11px] text-slate-400">Processing document text</span>
                        </div>
                        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-gradient-to-r from-teal-500 to-emerald-400 h-1.5 rounded-full animate-pulse w-3/4"></div>
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
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#0b0f19] hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-slate-100 transition-colors"
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
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#0b0f19] hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-slate-100 transition-colors"
                          >
                            <FileText className="w-3 h-3 text-teal-400" />
                            <span>PDF File</span>
                          </a>
                        )}
                      </div>

                      {/* Primary Q&A Action Button */}
                      <div>
                        {isCompleted ? (
                          <Link
                            to={`/paper/${effectivePaperId}/ask`}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-teal-600/20 transition-all active:scale-95"
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
                            <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                            <span>Adding to Library...</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStartPrepare(paper)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-teal-600/20 transition-all active:scale-95"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>Add to Library</span>
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
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#101625] border border-slate-800 hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <span>Page <strong className="text-slate-100">{arxivPage}</strong></span>

                <button
                  disabled={arxivPapers.length < 10 || isSearchingArxiv}
                  onClick={() => setArxivPage((p) => p + 1)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#101625] border border-slate-800 hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
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
                  ? `No external paper matched "${query}". Try searching by another topic, author name, or arXiv ID like "1706.03762".`
                  : 'Enter a topic, research question, author name, or arXiv ID in the search bar above to query open-access papers.'
              }
              actionLabel="Search Attention Papers"
              actionTo="/search?tab=arxiv&q=attention%20mechanism"
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
