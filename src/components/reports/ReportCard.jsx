import React from 'react';
import ExportButton from './ExportButton';
import { FileText } from 'lucide-react';

const ReportCard = ({ report }) => {
  return (
    <div className="theme-card p-5 rounded-2xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FF5A14]/10 text-[#FF5A14] flex items-center justify-center border border-[#FF5A14]/20 flex-shrink-0">
            <FileText size={20} />
          </div>
          <div>
            <h3 className="font-bold theme-heading text-sm sm:text-base">{report.name}</h3>
            <p className="text-xs theme-muted mt-0.5">{report.type} • Generated {report.date}</p>
          </div>
        </div>
      </div>
      <div className="flex justify-end mt-4 pt-4 border-t theme-border">
        <ExportButton reportId={report.id} fileName={report.name} />
      </div>
    </div>
  );
};

export default ReportCard;
