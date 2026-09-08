import React, { useState } from 'react';
import { reportsApi } from '../../api/reportsApi';
import { useToast } from '../../context/ToastContext';

const ExportButton = ({ reportId, fileName }) => {
  const [downloading, setDownloading] = useState(false);
  const { showToast } = useToast();

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await reportsApi.downloadReport(reportId);
      showToast(`Successfully exported ${fileName}`, 'success');
    } catch (err) {
      showToast(`Failed to export ${fileName}`, 'error');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button 
      onClick={handleDownload} 
      disabled={downloading}
      className="px-3 py-1.5 bg-primary text-white text-xs font-medium rounded hover:bg-hover disabled:opacity-50 transition-colors flex items-center gap-1"
    >
      {downloading ? (
        <span>Exporting...</span>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          Export Docx
        </>
      )}
    </button>
  );
};

export default ExportButton;
