import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Bookmark, Search, Info, Sparkles, Menu, X, Globe } from 'lucide-react';

export default function Navbar({ savedCount = 0, isConnected = false, papersCount = 41 }) {
  const location = useLocation();
  const [showAbout, setShowAbout] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const isArxivTab = location.pathname === '/search' && location.search.includes('tab=arxiv');
  const isLocalTab = location.pathname === '/search' && !location.search.includes('tab=arxiv');

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-100 tracking-tight flex items-center gap-1.5">
                AI Paper Explorer
                <span className={`text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded flex items-center gap-1.5 border ${
                  isConnected
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-indigo-400'}`}></span>
                  {isConnected ? 'Backend Connected' : 'v1.0'}
                </span>
              </span>
              <p className="text-[11px] text-slate-400 hidden sm:block">Semantic Vector Research Engine</p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/') && location.pathname === '/'
                  ? 'bg-slate-800 text-indigo-400 font-semibold'
                  : 'text-slate-300 hover:text-slate-100 hover:bg-slate-900'
              }`}
            >
              <Search className="w-4 h-4" />
              Explore
            </Link>

            <Link
              to="/search?tab=local"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isLocalTab
                  ? 'bg-slate-800 text-indigo-400 font-semibold'
                  : 'text-slate-300 hover:text-slate-100 hover:bg-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Library ({papersCount})
            </Link>

            <Link
              to="/search?tab=arxiv"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isArxivTab
                  ? 'bg-slate-800 text-indigo-400 font-semibold'
                  : 'text-slate-300 hover:text-slate-100 hover:bg-slate-900'
              }`}
            >
              <Globe className="w-4 h-4 text-purple-400" />
              <span>arXiv Explorer</span>
              <span className="px-1.5 py-0.2 text-[10px] uppercase font-bold tracking-wider rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                New
              </span>
            </Link>

            <Link
              to="/saved"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                isActive('/saved')
                  ? 'bg-slate-800 text-indigo-400 font-semibold'
                  : 'text-slate-300 hover:text-slate-100 hover:bg-slate-900'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              Saved Papers
              {savedCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-xs font-bold bg-indigo-500 text-white rounded-full">
                  {savedCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setShowAbout(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-900 transition-colors ml-2"
            >
              <Info className="w-4 h-4" />
              About Architecture
            </button>
          </nav>

          {/* Mobile menu toggle */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-950 px-4 pt-2 pb-4 space-y-1">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-900"
            >
              <Search className="w-4 h-4" />
              Explore
            </Link>
            <Link
              to="/search?tab=local"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-900"
            >
              <BookOpen className="w-4 h-4" />
              Local Library ({papersCount})
            </Link>
            <Link
              to="/search?tab=arxiv"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-900"
            >
              <span className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-400" /> arXiv Explorer
              </span>
              <span className="px-1.5 py-0.2 text-[10px] uppercase font-bold rounded bg-purple-500/20 text-purple-300">
                New
              </span>
            </Link>
            <Link
              to="/saved"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-900"
            >
              <span className="flex items-center gap-2">
                <Bookmark className="w-4 h-4" /> Saved Papers
              </span>
              {savedCount > 0 && (
                <span className="px-2 py-0.5 text-xs bg-indigo-500 text-white rounded-full">
                  {savedCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setShowAbout(true);
              }}
              className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-900"
            >
              <Info className="w-4 h-4" />
              About Architecture
            </button>
          </div>
        )}
      </header>

      {/* About Architecture Modal */}
      {showAbout && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-slate-100">AI Paper Explorer Architecture</h3>
              </div>
              <button
                onClick={() => setShowAbout(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm text-slate-300">
              <p>
                AI Research Paper Explorer is designed for semantic research discovery and grounded PDF question-answering.
              </p>
              
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 font-mono text-xs text-indigo-300">
                <div className="font-semibold text-slate-400 mb-1">// End-to-End Pipeline Architecture</div>
                <div>PDF Ingestion (PyMuPDF)</div>
                <div className="text-slate-500"> ↓ </div>
                <div>Text Cleaning & Paragraph Chunking (500 tokens)</div>
                <div className="text-slate-500"> ↓ </div>
                <div>Dense Embeddings (BAAI/bge-base-en-v1.5, 768-dim)</div>
                <div className="text-slate-500"> ↓ </div>
                <div>PostgreSQL 17 + pgvector (port 5433)</div>
                <div className="text-slate-500"> ↓ </div>
                <div className="text-emerald-400 font-bold">FastAPI RAG + React Frontend (Current UI Layer)</div>
              </div>

              <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-lg p-3 text-xs text-indigo-300">
                <strong>Full-Stack Architecture:</strong> Fully connected and live. Running FastAPI backend, PostgreSQL 17 + pgvector (768-dim BGE embeddings), LFM2.5 local instruction model, and official arXiv live search & automated ingestion.
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowAbout(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium text-sm transition-colors"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
