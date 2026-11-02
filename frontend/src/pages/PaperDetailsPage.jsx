import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MessageSquare,
  Tag,
  Calendar,
  FileText,
  CheckCircle2,
  HelpCircle,
  FileCode,
  Users,
  Download,
  Loader2
} from 'lucide-react';
import BookmarkButton from '../components/BookmarkButton';
import PaperMetadata from '../components/PaperMetadata';
import EmptyState from '../components/EmptyState';
import { formatApiPaper } from '../utils/paperAdapter';
import { API_BASE_URL } from '../config/api';

export default function PaperDetailsPage({ papers = [], savedPaperIds = [], onToggleSave }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [fetchedPaper, setFetchedPaper] = useState(null);
  const [isLoadingPaper, setIsLoadingPaper] = useState(false);

  // Look for paper in existing papers prop from App
  const paper = papers.find((p) => String(p.id) === String(id)) || fetchedPaper;

  useEffect(() => {
    if (!paper && id && !isNaN(Number(id))) {
      setIsLoadingPaper(true);
      fetch(`${API_BASE_URL}/api/papers/${id}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            setFetchedPaper(formatApiPaper(data));
          }
        })
        .catch((err) => console.warn("Could not fetch paper details:", err))
        .finally(() => setIsLoadingPaper(false));
    }
  }, [id, paper]);

  if (isLoadingPaper) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
        <p className="text-sm text-slate-400">Loading paper overview...</p>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <EmptyState
          icon="search"
          title="Paper Not Found"
          description="The requested research paper could not be found in your collection."
          actionLabel="Return to Paper Library"
          actionTo="/search"
        />
      </div>
    );
  }

  const isSaved = savedPaperIds.includes(String(paper.id));

  const tabs = [
    { id: 'overview', label: 'Overview & Abstract' },
    { id: 'keyInfo', label: 'Key Details' },
    { id: 'problem', label: 'Research Objective' },
    { id: 'method', label: 'Methodology' },
    { id: 'results', label: 'Findings & Results' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Navigation Row */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-400 hover:text-slate-100 transition-colors bg-[#111726] border border-slate-800 px-3.5 py-2 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-3">
          <BookmarkButton
            isSaved={isSaved}
            onToggle={() => onToggleSave && onToggleSave(paper.id)}
            showLabel={true}
            size="md"
          />

          <Link
            to={`/paper/${paper.id}/ask`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-teal-600/20 transition-all active:scale-95"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Ask Questions</span>
          </Link>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="bg-[#111726]/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-teal-500/10 text-teal-300 border border-teal-500/20 text-xs font-semibold">
            <Tag className="w-3.5 h-3.5 text-teal-400" />
            <span>{paper.category || "Artificial Intelligence"}</span>
          </span>

          <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-medium px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60">
            <Calendar className="w-3.5 h-3.5" />
            <span>{paper.year || "Recent"}</span>
          </span>

          {paper.pages && (
            <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-medium px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60">
              <FileText className="w-3.5 h-3.5" />
              <span>{paper.pages} Pages</span>
            </span>
          )}

          <span className="inline-flex items-center gap-1 text-xs text-emerald-300 font-medium px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Full Text Indexed</span>
          </span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-100 leading-tight">
          {paper.title}
        </h1>

        <p className="text-xs sm:text-sm text-slate-400 flex items-center gap-2">
          <Users className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{paper.authors || "Academic Authors"}</span>
        </p>

        {/* Abstract Box */}
        <div className="bg-[#0b0f19]/80 border border-slate-800/80 rounded-2xl p-5 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <FileCode className="w-4 h-4 text-teal-400" />
            <span>Abstract</span>
          </h4>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-serif-quote">
            "{paper.abstract}"
          </p>
        </div>
      </div>

      {/* Main Content Layout (Interactive Tabs + Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Tabs Content */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Tab Navigation */}
          <div className="flex border-b border-slate-800 space-x-2 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-[#111726] text-teal-300 border-b-2 border-teal-500'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content Display */}
          <div className="bg-[#111726]/90 border border-slate-800 rounded-2xl p-6 space-y-4">
            {activeTab === 'overview' && (
              <div className="space-y-3">
                <h3 className="text-base sm:text-lg font-bold text-slate-100">Overview</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {paper.overview || paper.abstract}
                </p>
              </div>
            )}

            {activeTab === 'keyInfo' && (
              <div className="space-y-3">
                <h3 className="text-base sm:text-lg font-bold text-slate-100">Key Specifications</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {paper.keyInformation && paper.keyInformation.length > 0 ? (
                    paper.keyInformation.map((info, idx) => (
                      <div key={idx} className="bg-[#0b0f19] p-3.5 rounded-xl border border-slate-800">
                        <span className="text-xs text-slate-400 block font-medium">{info.label}</span>
                        <span className="text-xs sm:text-sm font-semibold text-teal-300">{info.value}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs sm:text-sm text-slate-400">Specifications available upon full extraction.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'problem' && (
              <div className="space-y-3">
                <h3 className="text-base sm:text-lg font-bold text-slate-100">Research Objective</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {paper.researchProblem || "Focuses on addressing core structural and methodological questions in this research domain."}
                </p>
              </div>
            )}

            {activeTab === 'method' && (
              <div className="space-y-3">
                <h3 className="text-base sm:text-lg font-bold text-slate-100">Methodology</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {paper.method || "Applies verified empirical evaluation, algorithmic modeling, and rigorous domain benchmarks."}
                </p>
              </div>
            )}

            {activeTab === 'results' && (
              <div className="space-y-3">
                <h3 className="text-base sm:text-lg font-bold text-slate-100">Findings & Benchmark Results</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {paper.results || "Demonstrates strong empirical outcomes and improvements across domain evaluation metrics."}
                </p>
              </div>
            )}
          </div>

          {/* Suggested Questions Section */}
          {paper.sampleQuestions && paper.sampleQuestions.length > 0 && (
            <div className="bg-[#111726]/60 border border-slate-800 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-teal-400 font-bold text-xs sm:text-sm">
                <HelpCircle className="w-4 h-4" />
                <span>Suggested Questions to Ask</span>
              </div>

              <div className="space-y-2">
                {paper.sampleQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => navigate(`/paper/${paper.id}/ask?initialQ=${encodeURIComponent(q)}`)}
                    className="w-full text-left p-3 rounded-xl bg-[#0b0f19] hover:bg-slate-800/80 border border-slate-800 hover:border-teal-500/40 text-xs sm:text-sm text-slate-200 hover:text-teal-300 transition-all flex items-center justify-between group"
                  >
                    <span>"{q}"</span>
                    <MessageSquare className="w-4 h-4 text-slate-500 group-hover:text-teal-400 shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Metadata Sidebar & CTA */}
        <div className="space-y-6">
          <PaperMetadata paper={paper} />

          {/* Ask Questions CTA Card */}
          <div className="bg-gradient-to-br from-teal-950/40 via-slate-900 to-[#111726] border border-teal-500/30 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-teal-300 font-bold text-sm">
              <MessageSquare className="w-5 h-5 text-teal-400" />
              <span>Ask About This Paper</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Ask questions about the paper's findings, methods, or conclusions. Answers are accompanied by exact page references and cited excerpts.
            </p>

            <Link
              to={`/paper/${paper.id}/ask`}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-teal-600/20 transition-all active:scale-95"
            >
              <span>Start Q&A Session</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
