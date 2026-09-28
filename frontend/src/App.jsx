import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import SearchResultsPage from './pages/SearchResultsPage';
import PaperDetailsPage from './pages/PaperDetailsPage';
import PaperQAPage from './pages/PaperQAPage';
import SavedPapersPage from './pages/SavedPapersPage';

export default function App() {
  // Saved paper IDs state with localStorage persistence
  const [savedPaperIds, setSavedPaperIds] = useState(() => {
    try {
      const stored = localStorage.getItem('ai_explorer_saved_papers');
      return stored ? JSON.parse(stored) : ['bge-v1-5', 'rag-paper-2020'];
    } catch {
      return ['bge-v1-5', 'rag-paper-2020'];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('ai_explorer_saved_papers', JSON.stringify(savedPaperIds));
    } catch (err) {
      console.error('Failed to persist saved papers:', err);
    }
  }, [savedPaperIds]);

  const handleToggleSave = (paperId) => {
    setSavedPaperIds((prev) =>
      prev.includes(paperId) ? prev.filter((id) => id !== paperId) : [...prev, paperId]
    );
  };

  const handleClearAllSaved = () => {
    setSavedPaperIds([]);
  };

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
        {/* Navigation Header */}
        <Navbar savedCount={savedPaperIds.length} />

        {/* Main Route Content */}
        <main className="flex-1">
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  savedPaperIds={savedPaperIds}
                  onToggleSave={handleToggleSave}
                />
              }
            />
            <Route
              path="/search"
              element={
                <SearchResultsPage
                  savedPaperIds={savedPaperIds}
                  onToggleSave={handleToggleSave}
                />
              }
            />
            <Route
              path="/paper/:id"
              element={
                <PaperDetailsPage
                  savedPaperIds={savedPaperIds}
                  onToggleSave={handleToggleSave}
                />
              }
            />
            <Route path="/paper/:id/ask" element={<PaperQAPage />} />
            <Route
              path="/saved"
              element={
                <SavedPapersPage
                  savedPaperIds={savedPaperIds}
                  onToggleSave={handleToggleSave}
                  onClearAllSaved={handleClearAllSaved}
                />
              }
            />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-900 bg-slate-950 py-8 px-4 text-center text-xs text-slate-400">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <span className="font-semibold text-slate-300">AI Research Paper Explorer</span> — Semantic Vector RAG Platform
            </div>
            <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
              <span>BAAI/bge-base-en-v1.5</span>
              <span>•</span>
              <span>PostgreSQL 17 + pgvector</span>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}
