import React from 'react';
import { Bookmark, Trash2 } from 'lucide-react';
import PaperCard from '../components/PaperCard';
import EmptyState from '../components/EmptyState';

export default function SavedPapersPage({
  papers = [],
  savedPaperIds = [],
  onToggleSave,
  onClearAllSaved
}) {
  const paperList = papers || [];
  const savedPapers = paperList.filter((p) =>
    savedPaperIds.includes(String(p.id)) || savedPaperIds.includes(p.id)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-teal-400 font-semibold text-xs uppercase tracking-wider">
            <Bookmark className="w-4 h-4" />
            <span>Personal Reading List</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-100 tracking-tight mt-1">
            Saved Papers ({savedPapers.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Articles you have bookmarked for quick reading, reference, and Q&A.
          </p>
        </div>

        {savedPapers.length > 0 && (
          <button
            onClick={onClearAllSaved}
            className="inline-flex items-center gap-1.5 text-xs text-rose-300 hover:text-rose-200 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Clear Reading List</span>
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
          title="Your reading list is empty"
          description="Bookmark research papers while exploring to save them here for quick access and question answering."
          actionLabel="Explore Paper Library"
          actionTo="/search"
        />
      )}
    </div>
  );
}
