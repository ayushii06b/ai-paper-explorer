import React, { useState } from 'react';
import { FileText, Copy, Check, Quote } from 'lucide-react';

export default function SourceCard({ source }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (source && source.text) {
      navigator.clipboard.writeText(source.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!source) return null;

  return (
    <div className="bg-[#090d16]/90 border border-teal-500/20 hover:border-teal-500/40 rounded-xl p-4 transition-all space-y-2.5">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-teal-300 font-semibold bg-teal-500/10 px-2.5 py-1 rounded-md border border-teal-500/20">
          <FileText className="w-3.5 h-3.5 text-teal-400" />
          <span>Page {source.page || 1}</span>
          {source.similarity !== undefined && (
            <>
              <span className="text-teal-600">•</span>
              <span className="text-emerald-400 font-normal">
                {source.similarity > 0.75
                  ? "High Match"
                  : source.similarity > 0.55
                  ? "Relevant"
                  : `${(source.similarity * 100).toFixed(0)}% Match`}
              </span>
            </>
          )}
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-xs px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 transition-colors"
          title="Copy excerpt to clipboard"
          aria-label="Copy excerpt"
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

      <div className="flex items-start gap-2 pt-1 text-xs sm:text-sm leading-relaxed">
        <Quote className="w-4 h-4 text-teal-500/50 shrink-0 mt-0.5" />
        <p className="text-slate-300 font-serif-quote">
          "{source.text}"
        </p>
      </div>
    </div>
  );
}
