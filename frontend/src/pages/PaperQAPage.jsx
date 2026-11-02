import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  Sparkles,
  HelpCircle,
  FileText,
  RotateCcw,
  AlertTriangle,
  ShieldCheck,
  BookOpen
} from 'lucide-react';
import ChatMessage from '../components/ChatMessage';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import { formatApiPaper } from '../utils/paperAdapter';
import { API_BASE_URL } from '../config/api';

export default function PaperQAPage({ papers = [] }) {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const initialQ = searchParams.get('initialQ');

  const [fetchedPaper, setFetchedPaper] = useState(null);
  const paper = papers.find((p) => String(p.id) === String(id)) || fetchedPaper;

  const [inputQuestion, setInputQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [requestError, setRequestError] = useState(null);
  const [lastAskedQuestion, setLastAskedQuestion] = useState('');

  const messagesEndRef = useRef(null);
  const hasAutoSubmittedRef = useRef(false);

  // Fetch paper from backend if not yet in state
  useEffect(() => {
    if (!paper && id && !isNaN(Number(id))) {
      fetch(`${API_BASE_URL}/api/papers/${id}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            setFetchedPaper(formatApiPaper(data));
          }
        })
        .catch((err) => console.warn("Could not fetch paper details:", err));
    }
  }, [id, paper]);

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
          description="Cannot start Q&A session because the specified paper could not be found."
          actionLabel="Return to Paper Library"
          actionTo="/search"
        />
      </div>
    );
  }

  const handleAskQuestion = async (questionText) => {
    const q = questionText || inputQuestion;
    if (!q.trim() || isLoading) return;

    setRequestError(null);
    setLastAskedQuestion(q.trim());
    const userMessageId = `user-${Date.now()}`;
    const newMsg = { id: userMessageId, sender: 'user', text: q.trim() };

    setMessages((prev) => [...prev, newMsg]);
    setInputQuestion('');
    setIsLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 60000);

    try {
      const isNumericId = !isNaN(Number(paper.id));
      const payload = {
        question: q.trim(),
        top_k: 3,
        paper_id: isNumericId ? Number(paper.id) : undefined,
        max_new_tokens: 400
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
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      const formattedSources = (data.sources || []).map((s, idx) => ({
        paper: s.paper,
        page: s.page,
        chunk: s.chunk_id !== undefined && s.chunk_id !== null ? s.chunk_id : idx + 1,
        similarity: s.similarity,
        text: s.text && s.text.trim().length > 0 ? s.text : `Source passage from ${s.paper} on page ${s.page}`
      }));

      const isLlmFailed = data.status === 'llm_failed';

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: data.answer,
          sources: formattedSources,
          isError: isLlmFailed,
          status: data.status,
          model: data.model
        }
      ]);
    } catch (err) {
      console.warn("Backend API request failed or timed out:", err);

      let errorMessage = "Unable to connect to the answer service. Please ensure the backend is running.";
      if (err.name === 'AbortError') {
        errorMessage = "The request timed out. The server or AI service may be temporarily busy. Please try again.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      setRequestError(errorMessage);

      // Clean error message in conversation with retry option
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          isError: true,
          text: errorMessage
        }
      ]);
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setRequestError(null);
    setMessages([]);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col h-[calc(100vh-4.5rem)]">
      
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            to={`/paper/${paper.id}`}
            className="p-2 rounded-xl bg-[#111726] border border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            title="Back to paper details"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-teal-400">Paper Q&A Assistant</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Verified Citations</span>
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-bold text-slate-100 line-clamp-1">
              {paper.title}
            </h1>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleResetChat}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-xl bg-[#111726] border border-slate-800 hover:bg-slate-800 transition-colors"
            title="Clear current Q&A history"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Error Alert if any */}
      {requestError && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{requestError}</span>
          </div>
          <button
            onClick={() => setRequestError(null)}
            className="text-rose-400 hover:text-rose-200 font-medium ml-2 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Conversation Stream */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-6">
        {messages.length === 0 && !isLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-6 max-w-lg mx-auto">
            <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
              <Sparkles className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-100">
                Ask anything about this research paper
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Questions are answered strictly using verified passages from this paper. Every answer cites exact page numbers so you can verify the facts.
              </p>
            </div>

            {/* Suggested Starter Questions */}
            {paper.sampleQuestions && paper.sampleQuestions.length > 0 && (
              <div className="w-full text-left space-y-2 pt-2">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <HelpCircle className="w-3.5 h-3.5 text-teal-400" />
                  <span>Suggested Questions</span>
                </div>
                {paper.sampleQuestions.map((sq, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAskQuestion(sq)}
                    className="w-full text-left p-3 rounded-xl bg-[#111726] hover:bg-slate-800/80 border border-slate-800 hover:border-teal-500/40 text-xs sm:text-sm text-slate-200 hover:text-teal-300 transition-all flex items-center justify-between group"
                  >
                    <span>"{sq}"</span>
                    <Send className="w-3.5 h-3.5 text-slate-500 group-hover:text-teal-400 shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                onRetry={msg.isError && lastAskedQuestion ? () => handleAskQuestion(lastAskedQuestion) : undefined}
              />
            ))}
            {isLoading && <LoadingState type="qa" />}
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
          className="relative flex items-center bg-[#101625] border border-slate-800 rounded-2xl p-2 shadow-xl focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20"
        >
          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            placeholder="Ask a question about this paper..."
            disabled={isLoading}
            className="w-full bg-transparent text-slate-100 placeholder-slate-400 px-4 py-2 text-xs sm:text-sm focus:outline-none disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={!inputQuestion.trim() || isLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold text-xs sm:text-sm transition-all shadow-md active:scale-95 shrink-0"
          >
            <span>Ask</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[11px] text-slate-400 text-center mt-2 flex items-center justify-center gap-1.5">
          <BookOpen className="w-3 h-3 text-teal-400" />
          <span>Answers are strictly grounded in paper text and cite exact page numbers</span>
        </p>
      </div>
    </div>
  );
}
