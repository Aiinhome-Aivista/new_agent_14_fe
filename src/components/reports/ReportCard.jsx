import React from 'react';
import ExportButton from './ExportButton';
import { FileText, FileCode2, Sparkles } from 'lucide-react';

const ReportCard = ({ report }) => {
  const isPdf = report?.name?.toLowerCase().endsWith('.pdf');
  const isDocx = report?.name?.toLowerCase().endsWith('.docx');

  return (
    <div className="theme-card p-5 rounded-2xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between border theme-border shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-start gap-3.5">
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
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                isPdf 
                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30' 
                  : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30'
              }`}>
                {isPdf ? 'Executive PDF Briefing' : 'Enterprise Word (.docx)'}
              </span>
            </div>
            <h3 className="font-bold theme-heading text-xs sm:text-sm truncate max-w-[220px]" title={report.name}>
              {report.name}
            </h3>
            <p className="text-[11px] theme-muted mt-0.5">
              Generated on {report.date}
            </p>
          </div>
        </div>
      </div>
      <div className="flex justify-end mt-3 pt-3 border-t theme-border">
        <ExportButton reportId={report.id} fileName={report.name} />
      </div>
    </div>
  );
};

export default ReportCard;
