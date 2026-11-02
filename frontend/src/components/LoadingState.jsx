import React from 'react';
import { Loader2, Sparkles, BookOpen } from 'lucide-react';

export default function LoadingState({
  message = "Searching research library...",
  type = "default",
  count = 6
}) {
  if (type === "qa") {
    return (
      <div className="bg-[#111726]/90 border border-teal-500/30 rounded-2xl p-6 space-y-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-500/15 text-teal-400">
            <Sparkles className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-100">
              Formulating Answer
            </div>
            <div className="text-xs text-teal-400 font-medium">
              Reviewing relevant passages and checking page citations...
            </div>
          </div>
        </div>

        <div className="space-y-2.5 pt-2 animate-pulse">
          <div className="h-3.5 bg-slate-800/80 rounded-md w-full"></div>
          <div className="h-3.5 bg-slate-800/80 rounded-md w-11/12"></div>
          <div className="h-3.5 bg-slate-800/80 rounded-md w-4/6"></div>
        </div>
      </div>
    );
  }

  if (type === "cards") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className="bg-[#111726]/60 border border-slate-800 rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="h-5 bg-slate-800 rounded-md w-28"></div>
              <div className="h-5 bg-slate-800 rounded-md w-14"></div>
            </div>
            <div className="space-y-2 pt-2">
              <div className="h-5 bg-slate-800 rounded-md w-full"></div>
              <div className="h-5 bg-slate-800 rounded-md w-4/5"></div>
            </div>
            <div className="h-3 bg-slate-850 bg-slate-800/60 rounded w-1/2"></div>
            <div className="h-16 bg-slate-900/60 rounded-xl"></div>
            <div className="pt-3 border-t border-slate-800/80 flex justify-between">
              <div className="h-8 bg-slate-800 rounded-xl w-24"></div>
              <div className="h-8 bg-slate-800 rounded-xl w-28"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 space-y-4 text-center">
      <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
      <p className="text-sm font-medium text-slate-300">{message}</p>
    </div>
  );
}
