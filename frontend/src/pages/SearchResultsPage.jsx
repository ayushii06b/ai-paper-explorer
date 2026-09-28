import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, SlidersHorizontal, BookOpen } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import PaperCard from '../components/PaperCard';
import EmptyState from '../components/EmptyState';
import { MOCK_PAPERS, MOCK_CATEGORIES, MOCK_YEARS } from '../data/mockPapers';

export default function SearchResultsPage({ savedPaperIds, onToggleSave }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedYear, setSelectedYear] = useState('All Years');
  const [sortBy, setSortBy] = useState('relevance');

  const handleSearchSubmit = (newQuery) => {
    setSearchParams(newQuery.trim() ? { q: newQuery.trim() } : {});
  };

  const filteredPapers = useMemo(() => {
    return MOCK_PAPERS.filter((paper) => {
      const q = query.toLowerCase().trim();
      const matchesQuery =
        !q ||
        paper.title.toLowerCase().includes(q) ||
        paper.abstract.toLowerCase().includes(q) ||
        paper.authors.toLowerCase().includes(q) ||
        paper.category.toLowerCase().includes(q);

      const matchesCategory =
        selectedCategory === 'All Categories' || paper.category === selectedCategory;

      const matchesYear =
        selectedYear === 'All Years' || String(paper.year) === selectedYear;

      return matchesQuery && matchesCategory && matchesYear;
    }).sort((a, b) => {
      if (sortBy === 'year-desc') return b.year - a.year;
      if (sortBy === 'year-asc') return a.year - b.year;
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return 0; // default relevance order
    });
  }, [query, selectedCategory, selectedYear, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header & Main Search */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
          <BookOpen className="w-4 h-4" />
          <span>Semantic Paper Index</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">
          Search Research Papers
        </h1>

        <div className="max-w-4xl">
          <SearchBar
            value={query}
            onChange={(val) => {
              setQuery(val);
              handleSearchSubmit(val);
            }}
            onSearch={handleSearchSubmit}
            placeholder="Search papers by concept, author, title, or task..."
          />
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        {/* Category & Year Selectors */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
          >
            {MOCK_CATEGORIES.map((cat, idx) => (
              <option key={idx} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
          >
            {MOCK_YEARS.map((yr, idx) => (
              <option key={idx} value={yr}>
                {yr}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Sort By:</span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
          >
            <option value="relevance">Relevance (Dense Cosine Similarity)</option>
            <option value="year-desc">Newest First</option>
            <option value="year-asc">Oldest First</option>
            <option value="title">Title (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-sm">
        <span className="text-slate-400">
          Showing <strong className="text-slate-200">{filteredPapers.length}</strong> research papers
          {query && <span> for "<span className="text-indigo-300">{query}</span>"</span>}
        </span>
        <span className="text-xs text-indigo-400/80 font-mono hidden sm:inline">
          FastAPI / pgvector Ready
        </span>
      </div>

      {/* Paper Results Grid */}
      {filteredPapers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPapers.map((paper) => (
            <PaperCard
              key={paper.id}
              paper={paper}
              isSaved={savedPaperIds.includes(paper.id)}
              onToggleSave={onToggleSave}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="search"
          title="No matching research papers"
          description={`No paper matched "${query}". Try searching for terms like "BAAI", "RAG", "ResNet", or "LoRA".`}
          actionLabel="Reset Search Filters"
          actionTo="/search"
        />
      )}
    </div>
  );
}
