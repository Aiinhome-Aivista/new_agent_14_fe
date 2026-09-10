import React, { useState } from 'react';
import { reportsApi } from '../../api/reportsApi';
import { useToast } from '../../context/ToastContext';

const ExportButton = ({ reportId, fileName }) => {
  const [downloading, setDownloading] = useState(false);
  const { showToast } = useToast();

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await reportsApi.downloadReport(reportId, fileName);
      showToast(`Successfully exported ${fileName}`, 'success');
    } catch (err) {
      showToast(`Failed to export ${fileName}`, 'error');
    } finally {
      setDownloading(false);
    }
  };

  const isPdf = fileName?.toLowerCase().endsWith('.pdf');
  const isDocx = fileName?.toLowerCase().endsWith('.docx');

  return (
    <button 
      onClick={handleDownload} 
      disabled={downloading}
      className={`px-3.5 py-1.5 text-white text-xs font-bold rounded-xl shadow-sm hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-1.5 ${
        isPdf 
          ? 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700' 
          : 'bg-gradient-to-r from-[#FF5A14] to-[#FF7A45]'
      }`}
    >
      {downloading ? (
        <span>Exporting...</span>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
          </svg>
          <span>{isPdf ? 'Download PDF' : (isDocx ? 'Export Word (.docx)' : 'Export Document')}</span>
        </>
      )}
    </button>
  );
};

export default ExportButton;
