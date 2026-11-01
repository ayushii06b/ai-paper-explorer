import React, { useState } from 'react';
import { FileText, Copy, Check, Quote } from 'lucide-react';

export default function SourceCard({ source }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(source.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900/90 border border-indigo-500/20 hover:border-indigo-500/40 rounded-xl p-4 transition-all space-y-2.5">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-indigo-400 font-semibold bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
          <FileText className="w-3.5 h-3.5" />
          <span>Page {source.page}</span>
          <span className="text-indigo-600">•</span>
          <span>Chunk {source.chunk}</span>
          {source.similarity !== undefined && (
            <>
              <span className="text-indigo-600">•</span>
              <span className="text-emerald-400 font-normal">{(source.similarity * 100).toFixed(1)}% match</span>
            </>
          )}
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
          title="Copy source passage"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy Excerpt</span>
            </>
          )}
        </button>
      </div>

      <div className="flex items-start gap-2 pt-1 text-slate-300 text-xs sm:text-sm italic leading-relaxed">
        <Quote className="w-4 h-4 text-indigo-500/60 shrink-0 mt-0.5" />
        <p className="not-italic text-slate-300">"{source.text}"</p>
      </div>
    </div>
  );
}
