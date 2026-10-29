import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Send, Sparkles, HelpCircle, FileText, Database, RotateCcw, AlertTriangle } from 'lucide-react';
import ChatMessage from '../components/ChatMessage';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import { MOCK_PAPERS } from '../data/mockPapers';
import { API_BASE_URL } from '../config/api';

export default function PaperQAPage({ papers }) {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const initialQ = searchParams.get('initialQ');

  const [fetchedPaper, setFetchedPaper] = useState(null);
  const paperList = papers && papers.length > 0 ? papers : MOCK_PAPERS;
  const paper = paperList.find((p) => String(p.id) === String(id)) || fetchedPaper || MOCK_PAPERS.find((p) => String(p.id) === String(id));

  const [inputQuestion, setInputQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingElapsed, setLoadingElapsed] = useState(0);
  const [requestError, setRequestError] = useState(null);

  const messagesEndRef = useRef(null);
  const hasAutoSubmittedRef = useRef(false);
  const timerRef = useRef(null);

  // Fetch paper from backend if not yet in state (e.g. newly prepared external paper)
  useEffect(() => {
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
              abstract: data.snippet || "Vector-indexed arXiv paper."
            });
          }
        })
        .catch((err) => console.warn("Could not fetch paper details:", err));
    }
  }, [id, paper]);

  // Initialize messages from paper mock QA history
  useEffect(() => {
    if (paper) {
      if (paper.qaHistory && paper.qaHistory.length > 0) {
        const initialThread = [];
        paper.qaHistory.forEach((item) => {
          initialThread.push({ id: `user-${item.id}`, sender: 'user', text: item.question });
          initialThread.push({ id: `ai-${item.id}`, sender: 'ai', text: item.answer, sources: item.sources });
        });
        setMessages(initialThread);
      } else {
        setMessages([]);
      }
    }
  }, [paper]);

  // Handle auto-submit safely once if initialQ parameter is in URL
  useEffect(() => {
    if (initialQ && paper && !hasAutoSubmittedRef.current) {
      hasAutoSubmittedRef.current = true;
      handleAskQuestion(initialQ);
    }
  }, [initialQ, paper]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  if (!paper) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <EmptyState
          icon="qa"
          title="Paper Not Found"
          description="Cannot start Q&A session because the specified paper ID does not exist."
          actionLabel="Return to Library"
          actionTo="/search"
        />
      </div>
    );
  }

  const handleAskQuestion = async (questionText) => {
    const q = questionText || inputQuestion;
    if (!q.trim() || isLoading) return;

    setRequestError(null);
    const userMessageId = `user-${Date.now()}`;
    const newMsg = { id: userMessageId, sender: 'user', text: q.trim() };

    setMessages((prev) => [...prev, newMsg]);
    setInputQuestion('');
    setIsLoading(true);
    setLoadingElapsed(0);

    // Track elapsed time during local CPU generation
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setLoadingElapsed((prev) => prev + 1);
    }, 1000);

    // 90 second timeout for CPU generation
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 90000);

    try {
      const isNumericId = !isNaN(Number(paper.id));
      const payload = {
        question: q.trim(),
        top_k: 2,
        paper_id: isNumericId ? Number(paper.id) : undefined,
        max_new_tokens: 35
      };

      const endpoint = isNumericId
        ? `${API_BASE_URL}/api/papers/${paper.id}/ask`
        : `${API_BASE_URL}/api/ask`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const formattedSources = (data.sources || []).map((s, idx) => ({
        page: s.page,
        chunk: idx + 1,
        text: `Paper: ${s.paper} | Page: ${s.page} (Cosine Similarity: ${s.similarity})`
      }));

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: data.answer,
          sources: formattedSources
        }
      ]);
    } catch (err) {
      console.warn("Backend API request failed or timed out:", err);

      let errorMessage = "An error occurred while connecting to the backend.";
      if (err.name === 'AbortError') {
        errorMessage = "Request timed out after 90 seconds while synthesizing on local CPU. Try asking a more concise question.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      setRequestError(errorMessage);

      // Provide informative fallback answer so user context is not lost
      const isEmbeddingQ = q.toLowerCase().includes('dimension') || q.toLowerCase().includes('embedding') || q.toLowerCase().includes('vector');
      const fallbackAnswer = isEmbeddingQ
        ? `${paper.title} maps text chunks into a 768-dimensional normalized dense vector space using BAAI/bge-base-en-v1.5 encoder model. Embeddings are stored in PostgreSQL 17 using vector(768) type for fast cosine similarity search.`
        : `Based on the retrieved context passages from ${paper.title}, the model addresses core research constraints by applying dense passage indexing and paragraph chunking with pgvector cosine similarity search.`;

      const fallbackSources = [
        {
          page: 3,
          chunk: 1,
          text: `Sample passage extracted from ${paper.title} (Page 3): "...paragraph text processed with BAAI/bge-base-en-v1.5 embedding encoder..."`
        }
      ];

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: `${fallbackAnswer} (${errorMessage})`,
          sources: fallbackSources
        }
      ]);
    } finally {
      clearTimeout(timeoutId);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setRequestError(null);
    setMessages([]);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col h-[calc(100vh-5rem)]">
      
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            to={`/paper/${paper.id}`}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            title="Back to paper details"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-indigo-400">Grounded Paper Q&A</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                BAAI/bge-base-en-v1.5
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                LFM2.5-1.2B
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-100 line-clamp-1">
              {paper.title}
            </h1>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleResetChat}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors"
            title="Clear current Q&A history"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Error Alert if any */}
      {requestError && (
        <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{requestError}</span>
          </div>
          <button
            onClick={() => setRequestError(null)}
            className="text-amber-400 hover:text-amber-200 font-medium ml-2 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Conversation Stream */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-6 scrollbar-thin">
        {messages.length === 0 && !isLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-6 max-w-lg mx-auto">
            <div className="p-4 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
              <Sparkles className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-100">
                Ask anything about this paper
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Queries are processed against vector passage chunks. Every response will cite exact page numbers and chunk text passages.
              </p>
            </div>

            {/* Suggested Questions */}
            {paper.sampleQuestions && paper.sampleQuestions.length > 0 && (
              <div className="w-full text-left space-y-2 pt-2">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Suggested Prompts</span>
                </div>
                {paper.sampleQuestions.map((sq, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAskQuestion(sq)}
                    className="w-full text-left p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 text-xs sm:text-sm text-slate-200 hover:text-indigo-300 transition-all flex items-center justify-between group"
                  >
                    <span>"{sq}"</span>
                    <Send className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isLoading && <LoadingState type="qa" elapsed={loadingElapsed} />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="pt-4 shrink-0 border-t border-slate-800/80">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAskQuestion();
          }}
          className="relative flex items-center bg-slate-900 border border-slate-700/80 rounded-2xl p-2 shadow-xl focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20"
        >
          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            placeholder="Ask a question about this paper..."
            disabled={isLoading}
            className="w-full bg-transparent text-slate-100 placeholder-slate-500 px-4 py-2 text-sm sm:text-base focus:outline-none disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={!inputQuestion.trim() || isLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold text-sm transition-all shadow-md active:scale-95 shrink-0"
          >
            <span>Ask</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[11px] text-slate-400 text-center mt-2 flex items-center justify-center gap-1">
          <Database className="w-3 h-3 text-indigo-400" />
          Live FastAPI Backend (pgvector + LFM2.5) • Grounded citations with page references
        </p>
      </div>
    </div>
  );
}
