import React from 'react';
import { User, Sparkles, Database } from 'lucide-react';
import SourceCard from './SourceCard';

export default function ChatMessage({ message }) {
  const isUser = message.sender === 'user';

  if (isUser) {
    return (
      <div className="flex items-start justify-end gap-3 max-w-3xl ml-auto">
        <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-5 py-3.5 shadow-md space-y-1">
          <p className="text-sm sm:text-base font-medium leading-relaxed">{message.text}</p>
          <span className="text-[10px] text-indigo-200 opacity-80 block text-right">User Question</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white shrink-0 shadow-sm mt-1">
          <User className="w-4 h-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3.5 max-w-4xl mr-auto">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-500/20 mt-1">
        <Sparkles className="w-5 h-5" />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-sm p-5 shadow-lg space-y-4 flex-1">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-200">Grounded AI Answer</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <Database className="w-3 h-3" />
              Verified Paper Passages
            </span>
          </div>
          <span className="text-[11px] text-slate-500">PostgreSQL Vector Match</span>
        </div>

        {/* Answer Text */}
        <p className="text-sm sm:text-base text-slate-200 leading-relaxed whitespace-pre-wrap">
          {message.text}
        </p>

        {/* Grounded Sources */}
        {message.sources && message.sources.length > 0 && (
          <div className="pt-3 border-t border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Retrieved Context Passages ({message.sources.length})
              </h5>
              <span className="text-[11px] text-slate-400">BAAI/bge-base-en-v1.5</span>
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
