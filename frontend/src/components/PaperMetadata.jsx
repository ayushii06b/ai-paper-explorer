import React from 'react';
import { Calendar, User, Tag, FileText, Database, Layers } from 'lucide-react';

export default function PaperMetadata({ paper }) {
  if (!paper) return null;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg">
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
        Paper Metadata & Vector Specs
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-slate-800 text-slate-400 mt-0.5">
            <User className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Authors</span>
            <span className="font-semibold text-slate-200">{paper.authors}</span>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-slate-800 text-slate-400 mt-0.5">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Publication Year</span>
            <span className="font-semibold text-slate-200">{paper.year}</span>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-slate-800 text-slate-400 mt-0.5">
            <Tag className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Category</span>
            <span className="font-semibold text-indigo-300">{paper.category}</span>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-slate-800 text-slate-400 mt-0.5">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Document Size</span>
            <span className="font-semibold text-slate-200">{paper.pages || 12} Pages</span>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 mt-0.5 border border-indigo-500/20">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Embedding Architecture</span>
            <span className="font-semibold text-indigo-300">BAAI/bge-base-en-v1.5 (768-dim)</span>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 mt-0.5 border border-indigo-500/20">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Vector Store Target</span>
            <span className="font-semibold text-slate-200">PostgreSQL 17 + pgvector</span>
          </div>
        </div>
      </div>
    </div>
  );
}
