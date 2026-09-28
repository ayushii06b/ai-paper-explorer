import React from 'react';
import { Search, X, ArrowRight } from 'lucide-react';

export default function SearchBar({
  value,
  onChange,
  onSearch,
  placeholder = "Search by concept, methodology, title, or key query (e.g. 768-dim embeddings, RAG, LoRA)...",
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
        className={`relative flex items-center bg-slate-900 border border-slate-700/80 rounded-2xl shadow-xl transition-all duration-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 ${
          isLarge ? 'p-2 sm:p-2.5' : 'p-1.5'
        }`}
      >
        <div className="pl-3.5 pr-2 text-slate-400 group-focus-within:text-indigo-400 transition-colors">
          <Search className={isLarge ? "w-6 h-6" : "w-5 h-5"} />
        </div>

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={`w-full bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none ${
            isLarge ? 'text-base sm:text-lg py-1' : 'text-sm py-1'
          }`}
        />

        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-full hover:bg-slate-800 transition-colors mr-1"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <button
          type="submit"
          className={`flex items-center gap-1.5 font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-600/25 active:scale-95 ${
            isLarge ? 'px-5 py-3 text-sm sm:text-base' : 'px-4 py-2 text-xs sm:text-sm'
          }`}
        >
          <span>Search</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}
