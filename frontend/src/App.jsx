import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import SearchResultsPage from './pages/SearchResultsPage';
import PaperDetailsPage from './pages/PaperDetailsPage';
import PaperQAPage from './pages/PaperQAPage';
import SavedPapersPage from './pages/SavedPapersPage';
import { formatApiPaper } from './utils/paperAdapter';
import { API_BASE_URL } from './config/api';
import { AlertCircle, RefreshCw, BookOpen, Sparkles } from 'lucide-react';

export default function App() {
  const [papers, setPapers] = useState([]);
  const [isLoadingPapers, setIsLoadingPapers] = useState(true);
  const [backendError, setBackendError] = useState(null);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  // Saved paper IDs state with localStorage persistence
  const [savedPaperIds, setSavedPaperIds] = useState(() => {
    try {
      const stored = localStorage.getItem('ai_explorer_saved_papers');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Fetch real papers strictly from FastAPI backend
  const fetchPapers = useCallback(async () => {
    setIsLoadingPapers(true);
    setBackendError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/papers`);
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        const formatted = data.map(formatApiPaper);
        setPapers(formatted);
        setIsBackendConnected(true);
        setBackendError(null);
      } else {
        setPapers([]);
      }
    } catch (err) {
      console.warn('Backend connection failed:', err);
      setIsBackendConnected(false);
      setBackendError(
        'Unable to connect to the research library service. Please make sure the backend server is running and accessible.'
      );
      setPapers([]);
    } finally {
      setIsLoadingPapers(false);
    }
  }, []);

  useEffect(() => {
    fetchPapers();
  }, [fetchPapers]);

  useEffect(() => {
    try {
      localStorage.setItem('ai_explorer_saved_papers', JSON.stringify(savedPaperIds));
    } catch (err) {
      console.error('Failed to persist saved papers:', err);
    }
  }, [savedPaperIds]);

  const handleToggleSave = (paperId) => {
    const idStr = String(paperId);
    setSavedPaperIds((prev) =>
      prev.includes(idStr) ? prev.filter((id) => id !== idStr) : [...prev, idStr]
    );
  };

  const handleClearAllSaved = () => {
    setSavedPaperIds([]);
  };

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100 font-sans selection:bg-teal-500 selection:text-white">
        {/* Navigation Header */}
        <Navbar
          savedCount={savedPaperIds.length}
          isConnected={isBackendConnected}
          papersCount={papers.length}
          isLoading={isLoadingPapers}
          onRetry={fetchPapers}
        />

        {/* Global Connection Alert Banner (if backend is disconnected and not currently loading) */}
        {backendError && !isLoadingPapers && (
          <div className="bg-rose-950/40 border-b border-rose-500/20 px-4 py-2.5 text-xs text-rose-300">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  <strong>Library Offline:</strong> {backendError}
                </span>
              </div>
              <button
                onClick={fetchPapers}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-medium transition-colors shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Connection</span>
              </button>
            </div>
          </div>
        )}

        {/* Main Route Content */}
        <main className="flex-1">
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  papers={papers}
                  isLoading={isLoadingPapers}
                  backendError={backendError}
                  onRetry={fetchPapers}
                  savedPaperIds={savedPaperIds}
                  onToggleSave={handleToggleSave}
                />
              }
            />
            <Route
              path="/search"
              element={
                <SearchResultsPage
                  papers={papers}
                  isLoading={isLoadingPapers}
                  backendError={backendError}
                  onRetry={fetchPapers}
                  savedPaperIds={savedPaperIds}
                  onToggleSave={handleToggleSave}
                />
              }
            />
            <Route
              path="/paper/:id"
              element={
                <PaperDetailsPage
                  papers={papers}
                  savedPaperIds={savedPaperIds}
                  onToggleSave={handleToggleSave}
                />
              }
            />
            <Route
              path="/paper/:id/ask"
              element={<PaperQAPage papers={papers} />}
            />
            <Route
              path="/saved"
              element={
                <SavedPapersPage
                  papers={papers}
                  savedPaperIds={savedPaperIds}
                  onToggleSave={handleToggleSave}
                  onClearAllSaved={handleClearAllSaved}
                />
              }
            />
          </Routes>
        </main>

        {/* Editorial Footer */}
        <footer className="border-t border-slate-800/80 bg-[#080c14] py-10 px-4 text-xs text-slate-400">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <BookOpen className="w-4 h-4 text-teal-400" />
                <span className="font-semibold text-slate-200 text-sm">AI Research Paper Explorer</span>
              </div>
              <p className="text-slate-500 text-[11px]">
                An intelligent academic discovery platform for reading, exploring, and querying scientific literature.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-slate-400">
              <Link to="/search" className="hover:text-slate-200 transition-colors">
                Paper Library ({papers.length})
              </Link>
              <Link to="/search?tab=arxiv" className="hover:text-slate-200 transition-colors">
                Discover on arXiv
              </Link>
              <Link to="/saved" className="hover:text-slate-200 transition-colors">
                Reading List ({savedPaperIds.length})
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}
