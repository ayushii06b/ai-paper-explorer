import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Bookmark, Search, Info, Sparkles, Menu, X, Globe, RefreshCw } from 'lucide-react';

export default function Navbar({
  savedCount = 0,
  isConnected = false,
  papersCount = 0,
  isLoading = false,
  onRetry
}) {
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
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#0b0f19]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Identity */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform duration-200">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg text-slate-100 tracking-tight">
                  AI Paper Explorer
                </span>
                
                {/* Live Connection Pill */}
                {isLoading ? (
                  <span className="text-[10px] font-medium tracking-wide px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                    <span>Connecting...</span>
                  </span>
                ) : isConnected ? (
                  <span className="text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>Library Online ({papersCount})</span>
                  </span>
                ) : (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      if (onRetry) onRetry();
                    }}
                    className="text-[10px] font-medium tracking-wide px-2 py-0.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5 transition-colors"
                    title="Click to reconnect to library"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>Offline • Click to Retry</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Academic Literature & Discovery
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                isActive('/') && location.pathname === '/'
                  ? 'bg-slate-800/80 text-teal-300 font-semibold shadow-inner'
                  : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/50'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Explore</span>
            </Link>

            <Link
              to="/search?tab=local"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                isLocalTab
                  ? 'bg-slate-800/80 text-teal-300 font-semibold shadow-inner'
                  : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Paper Library</span>
              {papersCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                  {papersCount}
                </span>
              )}
            </Link>

            <Link
              to="/search?tab=arxiv"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                isArxivTab
                  ? 'bg-slate-800/80 text-teal-300 font-semibold shadow-inner'
                  : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/50'
              }`}
            >
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>Discover on arXiv</span>
            </Link>

            <Link
              to="/saved"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors relative ${
                isActive('/saved')
                  ? 'bg-slate-800/80 text-teal-300 font-semibold shadow-inner'
                  : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/50'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>Reading List</span>
              {savedCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-full">
                  {savedCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setShowAbout(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors ml-2"
              title="How this platform works"
            >
              <Info className="w-4 h-4" />
              <span>How It Works</span>
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-[#080c14] px-4 pt-3 pb-5 space-y-1">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-800"
            >
              <Search className="w-4 h-4 text-teal-400" />
              <span>Explore Home</span>
            </Link>
            <Link
              to="/search?tab=local"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-800"
            >
              <span className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-teal-400" />
                <span>Paper Library</span>
              </span>
              {papersCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {papersCount}
                </span>
              )}
            </Link>
            <Link
              to="/search?tab=arxiv"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-800"
            >
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>Discover on arXiv</span>
            </Link>
            <Link
              to="/saved"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-800"
            >
              <span className="flex items-center gap-2.5">
                <Bookmark className="w-4 h-4 text-teal-400" />
                <span>Reading List</span>
              </span>
              {savedCount > 0 && (
                <span className="px-2 py-0.5 text-xs bg-teal-500/20 text-teal-300 rounded-full font-semibold">
                  {savedCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setShowAbout(true);
              }}
              className="w-full text-left flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              <Info className="w-4 h-4" />
              <span>How It Works</span>
            </button>
          </div>
        )}
      </header>

      {/* How It Works Modal (Clear, Plain English) */}
      {showAbout && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-100">About AI Paper Explorer</h3>
                  <p className="text-xs text-slate-400">How the platform helps you understand research</p>
                </div>
              </div>
              <button
                onClick={() => setShowAbout(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
              <p>
                Traditional academic paper reading is time-consuming and filled with complex jargon. 
                <strong> AI Paper Explorer</strong> simplifies scientific exploration through four core capabilities:
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                  <div className="w-6 h-6 rounded-lg bg-teal-500/10 text-teal-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-200 text-xs sm:text-sm">Smart Concept Search</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Find papers based on meaning and research questions, even when your query words don't match the exact academic title.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                  <div className="w-6 h-6 rounded-lg bg-teal-500/10 text-teal-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-200 text-xs sm:text-sm">Plain-Language Summaries</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Explore structured overviews covering the research problem, methodology, and key benchmark results without wading through pages of raw text.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                  <div className="w-6 h-6 rounded-lg bg-teal-500/10 text-teal-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-200 text-xs sm:text-sm">Verified Question Answering</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Ask specific questions about any paper. Answers are strictly based on verified excerpts from the original text, complete with page citations.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                  <div className="w-6 h-6 rounded-lg bg-teal-500/10 text-teal-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-200 text-xs sm:text-sm">Explore Open Research</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Search millions of open-access papers from arXiv. With one click, import any paper into your personal collection for reading and questioning.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowAbout(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium text-xs sm:text-sm transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
