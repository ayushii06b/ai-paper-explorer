import React from 'react';
import { Search, X, ArrowRight } from 'lucide-react';

export default function SearchBar({
  value,
  onChange,
  onSearch,
  placeholder = "Search papers by topic, title, author, or question...",
  autoFocus = false,
  size = "lg"
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(value);
    }
  };

  const isLarge = size === "lg";

  return (
    <form onSubmit={handleSubmit} className="w-full relative group">
      <div
        className={`relative flex items-center bg-[#101625] border border-slate-800 rounded-2xl shadow-xl transition-all duration-200 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 ${
          isLarge ? 'p-2 sm:p-2.5' : 'p-1.5'
        }`}
      >
        <div className="pl-3.5 pr-2 text-slate-400 group-focus-within:text-teal-400 transition-colors">
          <Search className={isLarge ? "w-5 h-5 sm:w-6 sm:h-6" : "w-4 h-4 sm:w-5 sm:h-5"} />
        </div>

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={`w-full bg-transparent text-slate-100 placeholder-slate-400 focus:outline-none ${
            isLarge ? 'text-sm sm:text-base py-1' : 'text-xs sm:text-sm py-1'
          }`}
        />

        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-full hover:bg-slate-800 transition-colors mr-1"
            title="Clear search query"
            aria-label="Clear search query"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <button
          type="submit"
          className={`flex items-center gap-1.5 font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-xl transition-all shadow-md shadow-teal-600/20 active:scale-95 shrink-0 ${
            isLarge ? 'px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm' : 'px-3 sm:px-4 py-1.5 sm:py-2 text-xs'
          }`}
        >
          <span>Search</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}
