import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  BookOpen,
  ArrowRight,
  Compass,
  ShieldCheck,
  Globe,
  FileText,
  AlertCircle,
  RefreshCw,
  Search
} from 'lucide-react';
import SearchBar from '../components/SearchBar';
import PaperCard from '../components/PaperCard';
import LoadingState from '../components/LoadingState';

export default function HomePage({
  papers = [],
  isLoading = false,
  backendError = null,
  onRetry,
  savedPaperIds = [],
  onToggleSave
}) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (query) => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    } else {
      navigate('/search');
    }
  };

  const sampleTopics = [
    "Machine Learning",
    "Computer Vision",
    "Natural Language Processing",
    "Neural Networks",
    "Robotics"
  ];

  return (
    <div className="space-y-16 pb-20">
      
      {/* Editorial Hero Section */}
      <section className="relative pt-12 pb-10 sm:pt-20 sm:pb-16 px-4 text-center overflow-hidden">
        {/* Subtle background ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[320px] bg-teal-500/10 blur-[130px] rounded-full pointer-events-none"></div>

        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          
          {/* Welcome Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-teal-500/30 text-teal-300 text-xs font-semibold shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>Smart Academic Research & Question Answering</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-100 tracking-tight leading-tight">
            Explore Research Papers.{' '}
            <span className="bg-gradient-to-r from-teal-300 via-emerald-300 to-teal-100 bg-clip-text text-transparent">
              Understand Faster.
            </span>
          </h1>

          {/* Description */}
          <p className="text-sm sm:text-lg text-slate-300/85 max-w-2xl mx-auto leading-relaxed">
            Discover peer-reviewed literature, inspect key findings, and ask natural language questions strictly backed by verified citations and page references.
          </p>

          {/* Main Search Bar */}
          <div className="pt-4 max-w-3xl mx-auto space-y-3.5">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={handleSearch}
              placeholder="Search by topic, paper title, author, or research question..."
              size="lg"
            />

            {/* Quick Topic Suggestions */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">Popular topics:</span>
              {sampleTopics.map((topic, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSearch(topic)}
                  className="px-2.5 py-1 rounded-full bg-[#101625] border border-slate-800 hover:border-teal-500/40 text-slate-300 hover:text-teal-300 transition-colors"
                >
                  {topic}
                </button>
              ))}
            </div>

            {/* Jump to arXiv Global Explorer */}
            <div className="pt-1">
              <Link
                to="/search?tab=arxiv"
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-300 hover:text-emerald-200 text-xs font-medium transition-all shadow-sm group"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-45 transition-transform" />
                <span>Looking for external papers? Search millions of articles on <strong>arXiv Explorer</strong></span>
                <ArrowRight className="w-3 h-3 text-emerald-400" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Benefit Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#111726]/80 border border-slate-800/90 rounded-2xl p-6 space-y-3 shadow-md hover:border-slate-700 transition-all">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 w-fit border border-teal-500/20">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-100 text-base sm:text-lg">Smart Concept Search</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Search by concept or research problem. Find relevant papers and passages even if you don't know the exact academic terminology.
            </p>
          </div>

          <div className="bg-[#111726]/80 border border-slate-800/90 rounded-2xl p-6 space-y-3 shadow-md hover:border-slate-700 transition-all">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 w-fit border border-teal-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-100 text-base sm:text-lg">Verified Citations</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Every answer links directly to verified source passages with exact page numbers, preventing hallucinations and preserving provenance.
            </p>
          </div>

          <div className="bg-[#111726]/80 border border-slate-800/90 rounded-2xl p-6 space-y-3 shadow-md hover:border-slate-700 transition-all">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 w-fit border border-teal-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-100 text-base sm:text-lg">Structured Syntheses</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Quickly grasp research problems, core methodologies, and benchmark results cleanly laid out for fast, thorough literature review.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Research Papers Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-end justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-teal-400 font-semibold text-xs uppercase tracking-wider">
              <Compass className="w-4 h-4" />
              <span>Paper Collection</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-extrabold text-slate-100 tracking-tight mt-1">
              Featured Research Papers
            </h2>
          </div>

          {papers.length > 0 && (
            <Link
              to="/search"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-teal-400 hover:text-teal-300 transition-colors"
            >
              <span>View All Papers ({papers.length})</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* Loading State Skeleton */}
        {isLoading && (
          <LoadingState type="cards" count={6} />
        )}

        {/* Error State with Retry Button */}
        {!isLoading && backendError && papers.length === 0 && (
          <div className="bg-[#111726]/80 border border-rose-500/30 rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-100">Research Library Service Unavailable</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Could not connect to the backend database to load research papers. Please verify that your backend server is running.
              </p>
            </div>
            {onRetry && (
              <div className="pt-2">
                <button
                  onClick={onRetry}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-md shadow-teal-600/20 active:scale-95"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Retry Connection</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Empty State (when connected but 0 papers ingested) */}
        {!isLoading && !backendError && papers.length === 0 && (
          <div className="bg-[#111726]/60 border border-slate-800 border-dashed rounded-3xl p-10 text-center max-w-lg mx-auto space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mx-auto">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-100">No Papers in Library Yet</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Your paper collection is currently empty. You can discover open-access research papers on arXiv and import them into your library.
              </p>
            </div>
            <Link
              to="/search?tab=arxiv"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-md shadow-teal-600/20 active:scale-95"
            >
              <span>Explore Papers on arXiv</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Real Papers Grid (Top 6 on Homepage) */}
        {!isLoading && papers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {papers.slice(0, 6).map((paper) => (
              <PaperCard
                key={paper.id}
                paper={paper}
                isSaved={savedPaperIds.includes(String(paper.id))}
                onToggleSave={onToggleSave}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
