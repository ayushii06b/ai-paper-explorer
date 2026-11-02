import React from 'react';
import { User, Sparkles, ShieldCheck, BookOpen, AlertCircle } from 'lucide-react';
import SourceCard from './SourceCard';

export default function ChatMessage({ message, onRetry }) {
  const isUser = message.sender === 'user';
  const isError = message.isError;

  if (isUser) {
    return (
      <div className="flex items-start justify-end gap-3 max-w-3xl ml-auto">
        <div className="bg-teal-600 text-white rounded-2xl rounded-tr-sm px-5 py-3.5 shadow-md space-y-1">
          <p className="text-sm sm:text-base font-medium leading-relaxed">{message.text}</p>
          <span className="text-[10px] text-teal-200 block text-right">Your Question</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300 shrink-0 shadow-sm mt-1">
          <User className="w-4 h-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3.5 max-w-4xl mr-auto w-full">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-teal-500/20 mt-1">
        <Sparkles className="w-4 h-4" />
      </div>

      <div className="bg-[#111726] border border-slate-800 rounded-2xl rounded-tl-sm p-5 sm:p-6 shadow-lg space-y-4 flex-1">
        {/* Top Answer Badge */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-100">AI Assistant</span>
            {isError ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-rose-400" />
                <span>Inference Issue</span>
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Grounded in Paper Text</span>
              </span>
            )}
          </div>

          <span className="text-[11px] text-slate-400 hidden sm:inline flex items-center gap-1">
            <BookOpen className="w-3 h-3 text-teal-400" />
            <span>Direct Citations</span>
          </span>
        </div>

        {/* Answer Content */}
        {isError ? (
          <div className="bg-rose-950/30 border border-rose-500/30 rounded-xl p-4 space-y-2 text-rose-200 text-xs sm:text-sm">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Could not complete question</span>
            </div>
            <p className="text-rose-300 leading-relaxed">{message.text}</p>
            {onRetry && (
              <div className="pt-2">
                <button
                  onClick={onRetry}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-semibold transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm sm:text-base text-slate-200 leading-relaxed whitespace-pre-wrap">
            {message.text}
          </div>
        )}

        {/* Verified Grounded Sources */}
        {message.sources && message.sources.length > 0 && (
          <div className="pt-3 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold uppercase tracking-wider text-teal-400">
                Cited Paper Passages ({message.sources.length})
              </h5>
              <span className="text-[11px] text-slate-400">Verified from original text</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {message.sources.map((source, idx) => (
                <SourceCard key={idx} source={source} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
