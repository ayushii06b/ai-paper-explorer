import React from 'react';
import { Search, Bookmark, FileSearch, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EmptyState({
  icon = "search",
  title = "No research papers found",
  description = "Try adjusting your keywords or clearing selected category filters.",
  actionLabel = "Explore Papers",
  actionTo = "/"
}) {
  const renderIcon = () => {
    switch (icon) {
      case 'bookmark':
        return <Bookmark className="w-10 h-10 text-indigo-400" />;
      case 'qa':
        return <FileSearch className="w-10 h-10 text-indigo-400" />;
      default:
        return <Search className="w-10 h-10 text-indigo-400" />;
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 border-dashed rounded-3xl p-10 text-center flex flex-col items-center justify-center space-y-4 max-w-lg mx-auto my-8">
      <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 shadow-inner">
        {renderIcon()}
      </div>

      <div className="space-y-1">
        <h3 className="text-xl font-bold text-slate-100">{title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
      </div>

      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 transition-all active:scale-95 mt-2"
        >
          <span>{actionLabel}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}
