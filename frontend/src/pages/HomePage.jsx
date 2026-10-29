import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, Database, Layers, ArrowRight, BookOpen, Compass, ShieldCheck, Globe } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import PaperCard from '../components/PaperCard';
import { MOCK_PAPERS } from '../data/mockPapers';

export default function HomePage({ papers, savedPaperIds, onToggleSave }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const paperList = papers && papers.length > 0 ? papers : MOCK_PAPERS;

  const handleSearch = (query) => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    } else {
      navigate('/search');
    }
  };

  const sampleKeywords = [
    "BAAI/bge-base-en-v1.5",
    "RAG Architecture",
    "Transformer Models",
    "LoRA Fine-Tuning",
    "ResNet Skip Connections"
  ];

  return (
    <div className="space-y-16 pb-16">
      
      {/* Hero Section */}
      <section className="relative pt-12 pb-8 sm:pt-20 sm:pb-14 px-4 text-center overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-indigo-500/30 text-indigo-300 text-xs font-semibold shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Dense Vector Search & Grounded Citation Engine</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-100 tracking-tight leading-tight">
            Explore Research.{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-200 bg-clip-text text-transparent">
              Understand Faster.
            </span>
          </h1>

          {/* Description */}
          <p className="text-base sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Search scientific literature with 768-dimensional dense vector embeddings, inspect paper breakdowns, and ask grounded AI questions backed by exact page source passages.
          </p>

          {/* Main Search Bar */}
          <div className="pt-4 max-w-3xl mx-auto">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={handleSearch}
              placeholder="Search by concept, model, or paper question (e.g. 768-dim embeddings, RAG)..."
              size="lg"
            />

            {/* Quick Keyword Suggestions */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-3 text-xs">
              <span className="text-slate-500 font-medium">Try searching:</span>
              {sampleKeywords.map((kw, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSearch(kw)}
                  className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-slate-400 hover:text-indigo-300 transition-colors"
                >
                  {kw}
                </button>
              ))}
            </div>

            {/* Quick jump to arXiv Global Explorer */}
            <div className="pt-3">
              <Link
                to="/search?tab=arxiv"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-950/40 border border-purple-500/30 hover:border-purple-500/60 text-purple-300 hover:text-purple-200 text-xs font-medium transition-all shadow-sm group"
              >
                <Globe className="w-3.5 h-3.5 text-purple-400 group-hover:rotate-45 transition-transform" />
                <span>Looking for external papers? Search millions of articles on <strong>arXiv Explorer</strong></span>
                <ArrowRight className="w-3 h-3 text-purple-400" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 w-fit border border-indigo-500/20">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-100 text-lg">768-Dim Vector Store</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Indexed with BAAI/bge-base-en-v1.5 dense embeddings and stored inside PostgreSQL 17 + pgvector for sub-10ms semantic retrieval.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 w-fit border border-indigo-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-100 text-lg">Grounded Citations</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every AI answer maps directly back to explicit document chunks and page numbers to prevent hallucinations.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 w-fit border border-indigo-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-100 text-lg">Structured Syntheses</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Extract research problems, core methodology, and benchmark results cleanly organized for rapid literature review.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Research Papers Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-end justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
              <Compass className="w-4 h-4" />
              <span>Curated Literature</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight mt-1">
              Explore Research Papers
            </h2>
          </div>

          <Link
            to="/search"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <span>View All Papers ({paperList.length})</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Paper Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paperList.slice(0, 6).map((paper) => (
            <PaperCard
              key={paper.id}
              paper={paper}
              isSaved={savedPaperIds.includes(paper.id)}
              onToggleSave={onToggleSave}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
