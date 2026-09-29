import React, { useState } from 'react';
import ExportButton from './ExportButton';
import { FileText, FileCode2, Clock, Trash2, ShieldCheck, CheckCircle2 } from 'lucide-react';

const ReportCard = ({ report, onDelete }) => {
  const [deleting, setDeleting] = useState(false);
  const isPdf = report?.name?.toLowerCase().endsWith('.pdf') || report?.file_type?.toLowerCase() === 'pdf';
  const isDocx = report?.name?.toLowerCase().endsWith('.docx') || report?.file_type?.toLowerCase() === 'docx';

  const handleDelete = async () => {
    if (!onDelete) return;
    if (window.confirm(`Are you sure you want to delete "${report.name}"?`)) {
      setDeleting(true);
      try {
        await onDelete(report.id);
      } finally {
        setDeleting(false);
      }
    }
  };

  return (
    <div className="theme-card p-5 rounded-2xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between border theme-border shadow-sm group">
      <div>
        {/* Top Header Row: Icon + Badges */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border font-black text-xs ${
              isPdf 
                ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' 
                : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
            }`}>
              {isPdf ? (
                <div className="flex flex-col items-center leading-none">
                  <FileText size={18} />
                  <span className="text-[8px] font-mono mt-0.5 font-bold">PDF</span>
                </div>
              ) : (
                <div className="flex flex-col items-center leading-none">
                  <FileCode2 size={18} />
                  <span className="text-[8px] font-mono mt-0.5 font-bold">DOCX</span>
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                isPdf 
                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30' 
                  : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30'
              }`}>
                {isPdf ? 'Executive PDF Briefing' : 'Enterprise Word (.docx)'}
              </span>
              {report?.size && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono theme-muted border theme-border bg-slate-100 dark:bg-white/5">
                  {report.size}
                </span>
              )}
            </div>
          </div>

          {onDelete && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 cursor-pointer disabled:opacity-30"
              title="Delete Report"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>

        {/* Report Filename */}
        <h3 
          className="font-bold theme-heading text-xs sm:text-sm break-all line-clamp-1 leading-snug" 
          title={report.name}
        >
          {report.name}
        </h3>

        {/* Summary Snippet */}
        <p className="text-[11px] theme-muted mt-1.5 line-clamp-2 leading-relaxed">
          {report?.summary || "Autonomous executive briefing covering cross-program milestone metrics, risk logs, and financial burn."}
        </p>
      </div>

      {/* Footer: Timestamp & Download Button */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t theme-border gap-2">
        <div className="flex items-center gap-1 text-[11px] theme-muted font-mono">
          <Clock size={12} className="text-slate-400 flex-shrink-0" />
          <span className="truncate">{report.date}</span>
        </div>
        <ExportButton reportId={report.id} fileName={report.name} />
      </div>
    </div>
  );
};

export default ReportCard;
