import React, { useState, useRef } from 'react';
import { ingestionApi } from '../../api/ingestionApi';
import { useToast } from '../../context/ToastContext';
import { FileUp, Loader2 } from 'lucide-react';

const UploadPanel = () => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef(null);
  const { showToast } = useToast();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    
    try {
      const res = await ingestionApi.uploadDocument(file, (p) => setProgress(p));
      if (res?.ai_processing_status === 'degraded_fallback') {
        showToast('AI processing degraded — some figures are heuristic estimates', 'warning');
      } else {
        showToast(`Successfully processed ${file.name}`, 'success');
      }
      setFile(null);
    } catch (err) {
      showToast('Error uploading document', 'error');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="theme-card rounded-2xl p-6 shadow-sm">
      <h3 className="text-base font-bold theme-heading mb-1 flex items-center gap-2">
        <FileUp size={18} className="text-[#FF5A14]" />
        <span>Upload Project Document</span>
      </h3>
      <p className="text-xs theme-muted mb-6">
        Upload MOMs, status reports, or SOWs (.docx, .pdf, .xlsx, .txt) to calibrate autonomous agent telemetry.
      </p>
      
      <form onDragEnter={handleDrag} onSubmit={(e) => e.preventDefault()}>
        <input ref={inputRef} type="file" className="hidden" accept=".pdf,.docx,.xlsx,.txt" onChange={handleChange} />
        
        <div 
          className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-all cursor-pointer relative overflow-hidden
            ${dragActive ? 'border-[#FF5A14] bg-[#FF5A14]/10' : 'theme-border hover:border-[#FF5A14]/50 theme-subtle'}
          `}
          onClick={() => inputRef.current.click()}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="w-12 h-12 rounded-full bg-[#FF5A14]/10 text-[#FF5A14] flex items-center justify-center mb-3">
            <FileUp size={24} />
          </div>
          <p className="theme-heading font-bold text-sm text-center">
            {file ? file.name : "Drag and drop your document here"}
          </p>
          <p className="theme-muted text-xs mt-1">
            or click to browse from your computer
          </p>
        </div>

        {uploading && (
          <div className="mt-6">
            <div className="flex justify-between text-xs theme-muted mb-1 font-mono">
              <span className="flex items-center gap-1.5">
                <Loader2 size={13} className="animate-spin text-[#FF5A14]" />
                <span>Chunking & Vectorizing into Memory...</span>
              </span>
              <span className="font-bold theme-heading">{progress}%</span>
            </div>
            <div className="w-full theme-badge rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || uploading}
            className="px-5 py-2.5 bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white rounded-xl text-xs font-bold shadow-md hover:brightness-110 disabled:opacity-40 transition-all flex items-center gap-2"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <FileUp size={14} />}
            <span>{uploading ? 'Processing...' : 'Upload & Process'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadPanel;
