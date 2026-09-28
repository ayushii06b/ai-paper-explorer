import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Send, Sparkles, HelpCircle, FileText, Database, RotateCcw } from 'lucide-react';
import ChatMessage from '../components/ChatMessage';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import { MOCK_PAPERS } from '../data/mockPapers';

export default function PaperQAPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const initialQ = searchParams.get('initialQ');

  const paper = MOCK_PAPERS.find((p) => p.id === id);

  const [inputQuestion, setInputQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialize messages from paper mock QA history or initial URL question
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

  // Handle auto-submit if initialQ parameter is in URL
  useEffect(() => {
    if (initialQ && paper) {
      handleAskQuestion(initialQ);
    }
  }, [initialQ]);

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

  const handleAskQuestion = (questionText) => {
    const q = questionText || inputQuestion;
    if (!q.trim() || isLoading) return;

    const userMessageId = `user-${Date.now()}`;
    const newMsg = { id: userMessageId, sender: 'user', text: q.trim() };

    setMessages((prev) => [...prev, newMsg]);
    setInputQuestion('');
    setIsLoading(true);

    // Simulate mock vector search & grounded LLM generation
    setTimeout(() => {
      const isEmbeddingQ = q.toLowerCase().includes('dimension') || q.toLowerCase().includes('embedding') || q.toLowerCase().includes('vector');
      
      const mockAnswer = isEmbeddingQ
        ? `${paper.title} maps text chunks into a 768-dimensional normalized dense vector space using BAAI/bge-base-en-v1.5 encoder model. Embeddings are stored in PostgreSQL 17 using vector(768) type for fast cosine similarity search.`
        : `Based on the retrieved context passages from ${paper.title}, the model addresses core research constraints by applying dense passage indexing and paragraph chunking up to 500 tokens with 75-token overlap boundaries.`;

      const mockSources = [
        {
          page: 3,
          chunk: 7,
          text: `Sample passage extracted from ${paper.title} (Page 3, Chunk 7): "...paragraph text processed with BAAI/bge-base-en-v1.5 embedding encoder..."`
        },
        {
          page: 5,
          chunk: 12,
          text: `Supporting reference passage (Page 5, Chunk 12): "...stored in PostgreSQL 17 pgvector database table paper_chunks..."`
        }
      ];

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: mockAnswer,
          sources: mockSources
        }
      ]);
      setIsLoading(false);
    }, 1200);
  };

  const handleResetChat = () => {
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
          UI Mock Mode • Answers cite 768-dim BGE vector matched chunks
        </p>
      </div>
    </div>
  );
}
