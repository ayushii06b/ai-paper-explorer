import React from 'react';
import { Bookmark, Trash2 } from 'lucide-react';
import PaperCard from '../components/PaperCard';
import EmptyState from '../components/EmptyState';
import { MOCK_PAPERS } from '../data/mockPapers';

export default function SavedPapersPage({ papers, savedPaperIds, onToggleSave, onClearAllSaved }) {
  const paperList = papers && papers.length > 0 ? papers : MOCK_PAPERS;
  const savedPapers = paperList.filter((p) => savedPaperIds.includes(String(p.id)) || savedPaperIds.includes(p.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
            <Bookmark className="w-4 h-4" />
            <span>Personal Reading List</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight mt-1">
            Saved Papers ({savedPapers.length})
          </h1>
        </div>

        {savedPapers.length > 0 && (
          <button
            onClick={onClearAllSaved}
            className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500/30 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Saved Papers</span>
          </button>
        )}
      </div>

      {/* Grid or Empty State */}
      {savedPapers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedPapers.map((paper) => (
            <PaperCard
              key={paper.id}
              paper={paper}
              isSaved={true}
              onToggleSave={onToggleSave}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="bookmark"
          title="No saved papers yet"
          description="Bookmark research papers while browsing to save them here for quick offline access and grounded Q&A."
          actionLabel="Explore Research Papers"
          actionTo="/search"
        />
      )}
    </div>
  );
}
