import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, FileText, ArrowRight, MessageSquare, Tag, Users } from 'lucide-react';
import BookmarkButton from './BookmarkButton';

export default function PaperCard({ paper, isSaved = false, onToggleSave }) {
  if (!paper) return null;

  return (
    <article className="group bg-[#111726]/90 border border-slate-800/90 hover:border-slate-700 rounded-2xl p-6 transition-all duration-200 hover:shadow-xl hover:shadow-teal-950/20 flex flex-col justify-between space-y-4">
      
      {/* Top Header Row: Category, Year, Length & Bookmark */}
      <div className="space-y-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-teal-500/10 text-teal-300 border border-teal-500/20 text-xs font-semibold">
              <Tag className="w-3 h-3 text-teal-400" />
              <span>{paper.category || "General Research"}</span>
            </span>

            {paper.year && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-medium px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>{paper.year}</span>
              </span>
            )}

            {paper.pages && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-medium px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60">
                <FileText className="w-3 h-3 text-slate-400" />
                <span>{paper.pages} pgs</span>
              </span>
            )}
          </div>

          <BookmarkButton
            isSaved={isSaved}
            onToggle={() => onToggleSave && onToggleSave(paper.id)}
            size="md"
          />
        </div>

        {/* Paper Title */}
        <Link to={`/paper/${paper.id}`} className="block focus:outline-none">
          <h3 className="text-base sm:text-lg font-bold text-slate-100 group-hover:text-teal-300 transition-colors leading-snug line-clamp-2">
            {paper.title}
          </h3>
        </Link>

        {/* Authors */}
        <p className="text-xs text-slate-400 flex items-center gap-1.5 line-clamp-1">
          <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{paper.authors || "Academic Authors"}</span>
        </p>

        {/* Abstract Snippet in Editorial Style */}
        <p className="text-xs sm:text-sm text-slate-300/85 leading-relaxed line-clamp-3 font-serif-quote bg-[#090d16]/60 p-3 rounded-xl border border-slate-800/60">
          "{paper.abstract || "Full abstract available on the paper details page."}"
        </p>
      </div>

      {/* Footer Actions */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
        <Link
          to={`/paper/${paper.id}`}
          className="inline-flex items-center gap-1.5 font-semibold text-slate-300 hover:text-white px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 transition-colors"
        >
          <span>Read Details</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
        </Link>

        <Link
          to={`/paper/${paper.id}/ask`}
          className="inline-flex items-center gap-1.5 font-semibold text-teal-200 hover:text-white px-3.5 py-2 rounded-xl bg-teal-950/60 hover:bg-teal-600 border border-teal-500/30 transition-all shadow-sm"
        >
          <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
          <span>Ask Questions</span>
        </Link>
      </div>
    </article>
  );
}
