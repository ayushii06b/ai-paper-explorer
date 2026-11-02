import React from 'react';
import { Search, Bookmark, FileSearch, ArrowRight, BookOpen, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EmptyState({
  icon = "search",
  title = "No research papers found",
  description = "Try adjusting your search keywords or clearing selected category filters.",
  actionLabel = "Browse Paper Library",
  actionTo,
  onAction
}) {
  const renderIcon = () => {
    switch (icon) {
      case 'bookmark':
        return <Bookmark className="w-9 h-9 text-teal-400" />;
      case 'qa':
        return <FileSearch className="w-9 h-9 text-teal-400" />;
      case 'error':
        return <AlertCircle className="w-9 h-9 text-rose-400" />;
      default:
        return <Search className="w-9 h-9 text-teal-400" />;
    }
  };

  const isError = icon === 'error';

  return (
    <div className="bg-[#111726]/60 border border-slate-800 border-dashed rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4 max-w-lg mx-auto my-8">
      <div className={`p-4 rounded-2xl border shadow-inner ${
        isError ? 'bg-rose-500/10 border-rose-500/20' : 'bg-teal-500/10 border-teal-500/20'
      }`}>
        {renderIcon()}
      </div>

      <div className="space-y-1.5 max-w-md">
        <h3 className="text-lg sm:text-xl font-bold text-slate-100">{title}</h3>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{description}</p>
      </div>

      {actionLabel && (
        actionTo ? (
          <Link
            to={actionTo}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all active:scale-95 mt-2 ${
              isError
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20'
                : 'bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-600/20'
            }`}
          >
            <span>{actionLabel}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        ) : onAction ? (
          <button
            onClick={onAction}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all active:scale-95 mt-2 ${
              isError
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20'
                : 'bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-600/20'
            }`}
          >
            <span>{actionLabel}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : null
      )}
    </div>
  );
}
