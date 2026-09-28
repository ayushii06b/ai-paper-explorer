import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, FileText, ArrowUpRight, MessageSquare, Tag } from 'lucide-react';
import BookmarkButton from './BookmarkButton';

export default function PaperCard({ paper, isSaved = false, onToggleSave }) {
  return (
    <div className="group bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/5 flex flex-col justify-between space-y-4">
      
      {/* Top badges & save button */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold">
              <Tag className="w-3 h-3" />
              {paper.category}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-medium px-2 py-0.5 rounded bg-slate-800">
              <Calendar className="w-3 h-3" />
              {paper.year}
            </span>
            {paper.pages && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-medium px-2 py-0.5 rounded bg-slate-800">
                <FileText className="w-3 h-3" />
                {paper.pages} pgs
              </span>
            )}
          </div>

          <BookmarkButton
            isSaved={isSaved}
            onToggle={() => onToggleSave(paper.id)}
            size="md"
          />
        </div>

        {/* Paper Title */}
        <Link to={`/paper/${paper.id}`} className="block">
          <h3 className="text-lg font-bold text-slate-100 group-hover:text-indigo-300 transition-colors leading-snug line-clamp-2">
            {paper.title}
          </h3>
        </Link>

        {/* Authors */}
        <p className="text-xs font-medium text-slate-400 line-clamp-1">
          {paper.authors}
        </p>

        {/* Abstract Snippet */}
        <p className="text-sm text-slate-300/90 leading-relaxed line-clamp-3">
          {paper.abstract}
        </p>
      </div>

      {/* Footer Action Buttons */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <Link
          to={`/paper/${paper.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          Open Details
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>

        <Link
          to={`/paper/${paper.id}/ask`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-300 hover:text-white px-3.5 py-2 rounded-lg bg-indigo-950/60 hover:bg-indigo-600 border border-indigo-500/30 transition-all shadow-sm"
        >
          <MessageSquare className="w-3.5 h-3.5 text-indigo-400 group-hover:text-white" />
          Ask Paper
        </Link>
      </div>
    </div>
  );
}
