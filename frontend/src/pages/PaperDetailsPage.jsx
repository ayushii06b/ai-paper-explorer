import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Tag, Calendar, FileText, CheckCircle2, HelpCircle, FileCode, Layers } from 'lucide-react';
import BookmarkButton from '../components/BookmarkButton';
import PaperMetadata from '../components/PaperMetadata';
import EmptyState from '../components/EmptyState';
import { MOCK_PAPERS } from '../data/mockPapers';
import { API_BASE_URL } from '../config/api';

export default function PaperDetailsPage({ papers, savedPaperIds, onToggleSave }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [fetchedPaper, setFetchedPaper] = useState(null);

  const paperList = papers && papers.length > 0 ? papers : MOCK_PAPERS;
  const paper = paperList.find((p) => String(p.id) === String(id)) || fetchedPaper || MOCK_PAPERS.find((p) => String(p.id) === String(id));

  React.useEffect(() => {
    if (!paper && id && !isNaN(Number(id))) {
      fetch(`${API_BASE_URL}/api/papers/${id}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            setFetchedPaper({
              id: String(data.id),
              title: data.title,
              authors: data.authors,
              year: data.year,
              category: data.category,
              abstract: data.snippet || "Paper stored in PostgreSQL + pgvector.",
              overview: data.snippet || "Extracted and tokenized in vector database."
            });
          }
        })
        .catch((err) => console.warn("Could not fetch paper details:", err));
    }
  }, [id, paper]);

  if (!paper) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <EmptyState
          icon="search"
          title="Paper Not Found"
          description="The requested research paper ID could not be located in the database."
          actionLabel="Return to Search"
          actionTo="/search"
        />
      </div>
    );
  }

  const isSaved = savedPaperIds.includes(paper.id);

  const tabs = [
    { id: 'overview', label: 'Overview & Abstract' },
    { id: 'keyInfo', label: 'Key Specifications' },
    { id: 'problem', label: 'Research Problem' },
    { id: 'method', label: 'Methodology' },
    { id: 'results', label: 'Benchmark Results' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-slate-100 transition-colors bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Library</span>
        </button>

        <div className="flex items-center gap-3">
          <BookmarkButton
            isSaved={isSaved}
            onToggle={() => onToggleSave(paper.id)}
            showLabel={true}
            size="md"
          />

          <Link
            to={`/paper/${paper.id}/ask`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 transition-all active:scale-95"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Ask This Paper</span>
          </Link>
        </div>
      </div>

      {/* Paper Main Header Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold">
            <Tag className="w-3.5 h-3.5" />
            {paper.category}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-medium px-2.5 py-1 rounded bg-slate-800">
            <Calendar className="w-3.5 h-3.5" />
            {paper.year}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-medium px-2.5 py-1 rounded bg-slate-800">
            <FileText className="w-3.5 h-3.5" />
            {paper.pages || 12} Pages
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
            <Layers className="w-3.5 h-3.5" />
            Vector Indexed (pgvector)
          </span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-100 leading-tight">
          {paper.title}
        </h1>

        <p className="text-sm sm:text-base font-semibold text-indigo-300/90">
          Authors: <span className="text-slate-300 font-normal">{paper.authors}</span>
        </p>

        {/* Abstract Box */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-5 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <FileCode className="w-4 h-4 text-indigo-400" />
            Abstract
          </h4>
          <p className="text-sm text-slate-300 leading-relaxed font-serif">
            "{paper.abstract}"
          </p>
        </div>
      </div>

      {/* Main Content Layout (Tabs + Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Interactive Sections & Tabs */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Tab Navigation */}
          <div className="flex border-b border-slate-800 space-x-2 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-t-xl text-sm font-semibold transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-indigo-400 border-b-2 border-indigo-500'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content Display */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
            {activeTab === 'overview' && (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-slate-100">Overview</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {paper.overview || paper.abstract}
                </p>
              </div>
            )}

            {activeTab === 'keyInfo' && (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-slate-100">Key Specifications</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {paper.keyInformation ? (
                    paper.keyInformation.map((info, idx) => (
                      <div key={idx} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                        <span className="text-xs text-slate-400 block font-medium">{info.label}</span>
                        <span className="text-sm font-semibold text-indigo-300">{info.value}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">Specifications available upon full extraction.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'problem' && (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-slate-100">Research Problem</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {paper.researchProblem || "Focuses on addressing structural limitations in current dense retrieval and deep learning architectures."}
                </p>
              </div>
            )}

            {activeTab === 'method' && (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-slate-100">Methodology</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {paper.method || "Employs contrastive fine-tuning and 768-dimensional normalized dense vector representation."}
                </p>
              </div>
            )}

            {activeTab === 'results' && (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-slate-100 font-sans">Benchmark Results</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {paper.results || "Demonstrates state-of-the-art retrieval accuracy across standard benchmarks."}
                </p>
              </div>
            )}
          </div>

          {/* Sample Questions section */}
          {paper.sampleQuestions && paper.sampleQuestions.length > 0 && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <HelpCircle className="w-4 h-4" />
                <span>Suggested Questions to Ask</span>
              </div>

              <div className="space-y-2">
                {paper.sampleQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => navigate(`/paper/${paper.id}/ask?initialQ=${encodeURIComponent(q)}`)}
                    className="w-full text-left p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 text-sm text-slate-200 hover:text-indigo-300 transition-all flex items-center justify-between group"
                  >
                    <span>"{q}"</span>
                    <MessageSquare className="w-4 h-4 text-slate-500 group-hover:text-indigo-400" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Metadata Sidebar */}
        <div className="space-y-6">
          <PaperMetadata paper={paper} />

          {/* Q&A CTA Banner */}
          <div className="bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <MessageSquare className="w-5 h-5" />
              <span>Ask Grounded AI Questions</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Ask specific questions about formulas, methodology, or results. Grounded source passages will be displayed alongside AI answers.
            </p>

            <Link
              to={`/paper/${paper.id}/ask`}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 transition-all active:scale-95"
            >
              <span>Launch Q&A Interface</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
