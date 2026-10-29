import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

export default function LoadingState({
  message = "Searching vector database with BGE embeddings...",
  type = "skeleton",
  elapsed = null
}) {
  if (type === "qa") {
    return (
      <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400">
            <Sparkles className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-200">
              Synthesizing Grounded Answer
            </div>
            <div className="text-xs text-indigo-400 font-medium">
              {elapsed !== null
                ? `${elapsed}s elapsed • Local LFM2.5 model processing on CPU`
                : 'Retrieving vector chunks with BAAI/bge-base-en-v1.5...'}
            </div>
          </div>
        </div>
        <div className="space-y-2 pt-2 animate-pulse">
          <div className="h-3 bg-slate-800 rounded w-full"></div>
          <div className="h-3 bg-slate-800 rounded w-5/6"></div>
          <div className="h-3 bg-slate-800 rounded w-4/6"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 space-y-4 text-center">
      <div className="p-3 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
      <p className="text-sm font-medium text-slate-300">{message}</p>
    </div>
  );
}
