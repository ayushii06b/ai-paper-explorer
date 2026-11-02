import React from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';

export default function BookmarkButton({
  isSaved,
  onToggle,
  showLabel = false,
  size = "md"
}) {
  const handleClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (onToggle) onToggle();
  };

  const buttonClasses = isSaved
    ? "bg-teal-500/15 text-teal-300 border-teal-500/40 hover:bg-teal-500/25"
    : "bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200 hover:bg-slate-800";

  const iconSize = size === "sm" ? "w-3.5 h-3.5" : size === "lg" ? "w-5 h-5" : "w-4 h-4";

  return (
    <button
      onClick={handleClick}
      title={isSaved ? "Remove from reading list" : "Save to reading list"}
      aria-label={isSaved ? "Remove from reading list" : "Save to reading list"}
      className={`inline-flex items-center gap-1.5 border rounded-xl transition-all duration-150 active:scale-95 font-medium ${buttonClasses} ${
        showLabel ? 'px-3 py-1.5 text-xs sm:text-sm' : 'p-2'
      }`}
    >
      {isSaved ? (
        <BookmarkCheck className={`${iconSize} text-teal-400 fill-teal-400/20`} />
      ) : (
        <Bookmark className={iconSize} />
      )}
      {showLabel && (
        <span>{isSaved ? "Saved" : "Save to Reading List"}</span>
      )}
    </button>
  );
}
