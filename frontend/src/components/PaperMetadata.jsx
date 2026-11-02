import React from 'react';
import { Calendar, User, Tag, FileText, CheckCircle2, ShieldCheck, Download } from 'lucide-react';

export default function PaperMetadata({ paper }) {
  if (!paper) return null;

  return (
    <div className="bg-[#111726]/90 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Paper Information
        </h4>
        <span className="text-[11px] text-teal-400 font-medium flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Ready for Q&A</span>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-slate-800/80 text-slate-400 mt-0.5 border border-slate-700/60">
            <User className="w-4 h-4 text-teal-400" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Authors</span>
            <span className="font-semibold text-slate-200">{paper.authors || "Not listed"}</span>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-slate-800/80 text-slate-400 mt-0.5 border border-slate-700/60">
            <Calendar className="w-4 h-4 text-teal-400" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Publication Year</span>
            <span className="font-semibold text-slate-200">{paper.year || "Recent"}</span>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-slate-800/80 text-slate-400 mt-0.5 border border-slate-700/60">
            <Tag className="w-4 h-4 text-teal-400" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Field of Study</span>
            <span className="font-semibold text-teal-300">{paper.category || "Artificial Intelligence"}</span>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-slate-800/80 text-slate-400 mt-0.5 border border-slate-700/60">
            <FileText className="w-4 h-4 text-teal-400" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Document Length</span>
            <span className="font-semibold text-slate-200">{paper.pages ? `${paper.pages} Pages` : "Full Paper"}</span>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 mt-0.5 border border-teal-500/20">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Citation Status</span>
            <span className="font-semibold text-slate-200">Indexed with Exact Page Numbers</span>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-slate-800/80 text-slate-400 mt-0.5 border border-slate-700/60">
            <Download className="w-4 h-4 text-teal-400" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Document Access</span>
            <span className="font-semibold text-slate-200">Open-Access PDF Available</span>
          </div>
        </div>
      </div>
    </div>
  );
}
