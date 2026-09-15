import React, { useState, useRef, useEffect } from 'react';
import { ingestionApi } from '../../api/ingestionApi';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { FileUp, Loader2, CheckCircle2, AlertTriangle, ShieldCheck, Layers, ChevronDown, X } from 'lucide-react';
import AccuracyWarningModal from './AccuracyWarningModal';

const UploadPanel = ({ onUploadSuccess }) => {
  const { user } = useAuth();
  const { activeProject, projects, setActiveProject } = useProject();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  // Status states
  const [checkingAccuracy, setCheckingAccuracy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Accuracy Modal State
  const [isAccuracyModalOpen, setIsAccuracyModalOpen] = useState(false);
  const [accuracyData, setAccuracyData] = useState(null);

  const inputRef = useRef(null);
  const { showToast } = useToast();

  // Keep selectedProjectId in sync with activeProject
  useEffect(() => {
    if (activeProject && activeProject.id !== 'all') {
      setSelectedProjectId(activeProject.id);
    } else if (projects && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [activeProject, projects]);

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

  // Step 1: Pre-Upload Accuracy Evaluation
  const handleInitiateUpload = async () => {
    if (!file) {
      showToast('Please select a project document to upload.', 'warning');
      return;
    }

    const targetProjectId = selectedProjectId || (projects && projects.length > 0 ? projects[0].id : null);
    if (!targetProjectId) {
      showToast('Please create or select an Enterprise Project before uploading documents.', 'warning');
      return;
    }

    setCheckingAccuracy(true);
    let checkRes = null;

    try {
      checkRes = await ingestionApi.checkAccuracy(file, targetProjectId);
    } catch (err) {
      console.warn('Accuracy pre-check failed, proceeding with direct upload:', err);
    } finally {
      setCheckingAccuracy(false);
    }

    if (checkRes && checkRes.success) {
      if (checkRes.passed) {
        // Score meets or exceeds threshold: proceed directly
        showToast(`Accuracy Check Passed: ${checkRes.match_percentage}% match! Ingesting into memory...`, 'success');
        await executeUpload(targetProjectId, false, checkRes.match_percentage);
      } else {
        // Score is below threshold: trigger low accuracy confirmation popup
        setAccuracyData(checkRes);
        setIsAccuracyModalOpen(true);
      }
    } else {
      // Fallback: if check failed unexpectedly, notify and allow proceeding
      showToast('Proceeding with standard ingestion.', 'info');
      await executeUpload(targetProjectId);
    }
  };

  // Step 2: Actual File Upload and Vectorization
  const executeUpload = async (targetProjectId, isOverride = false, score = null) => {
    setUploading(true);
    setProgress(0);

    const calculatedScore = score !== null ? score : (accuracyData?.match_percentage || 90);

    try {
      const res = await ingestionApi.uploadDocument(
        file, 
        (p) => setProgress(p),
        { 
          uploaded_by: user?.name || user?.email, 
          uploaded_by_role: user?.role,
          project_id: targetProjectId,
          accuracy_score: calculatedScore
        }
      );

      if (isOverride) {
        showToast(`Document saved with low accuracy override (${accuracyData?.match_percentage || 0}%).`, 'warning');
      } else if (res?.ai_processing_status === 'degraded_fallback') {
        showToast('AI processing degraded — some figures are heuristic estimates', 'warning');
      } else {
        showToast(`Successfully processed and vectorized ${file.name}!`, 'success');
      }

      setFile(null);
      setIsAccuracyModalOpen(false);
      setAccuracyData(null);

      if (onUploadSuccess) {
        onUploadSuccess(res);
      }
    } catch (err) {
      console.error('Error uploading document:', err);
      showToast(err.response?.data?.error || 'Error uploading and processing document', 'error');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  // Modal actions
  const handleConfirmOverride = async () => {
    const targetProjectId = selectedProjectId || (projects && projects.length > 0 ? projects[0].id : null);
    await executeUpload(targetProjectId, true);
  };

  const handleCancelModal = () => {
    setIsAccuracyModalOpen(false);
    setAccuracyData(null);
    setFile(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    showToast('Upload cancelled: low accuracy document was not saved.', 'info');
  };

  return (
    <div className="theme-card rounded-2xl p-6 shadow-sm relative">
      
      {/* Card Header */}
      <h3 className="text-base font-bold theme-heading mb-1 flex items-center gap-2">
        <FileUp size={18} className="text-[#FF5A14]" />
        <span>Upload Project Document</span>
      </h3>
      <p className="text-xs theme-muted mb-5">
        Upload MOMs, status reports, or SOWs (.docx, .pdf, .xlsx, .txt) to calibrate autonomous agent telemetry.
      </p>

      {/* Map to Enterprise Project Selector (Matching Screenshot) */}
      <div className="mb-4">
        <label className="block text-xs font-bold theme-heading mb-1.5 flex items-center justify-between">
          <span>Map to Enterprise Project</span>
          <span className="text-[10px] text-slate-400 font-normal">Scoped Accuracy Anchor</span>
        </label>
        <div className="relative">
          <select
            value={selectedProjectId || ''}
            onChange={(e) => {
              const pid = parseInt(e.target.value);
              setSelectedProjectId(pid);
              const found = projects?.find(p => p.id === pid);
              if (found && setActiveProject) {
                setActiveProject(found);
              }
            }}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0E1422] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs font-semibold focus:border-[#FF5A14] focus:ring-1 focus:ring-[#FF5A14] outline-none transition-all cursor-pointer appearance-none pr-9"
          >
            {projects && projects.length > 0 ? (
              projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.jira_key ? `[${p.jira_key}] ` : ''}{p.name}
                </option>
              ))
            ) : (
              <option value="">No projects available</option>
            )}
          </select>
          <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Drag & Drop Form */}
      <form onDragEnter={handleDrag} onSubmit={(e) => e.preventDefault()}>
        <input ref={inputRef} type="file" className="hidden" accept=".pdf,.docx,.xlsx,.txt" onChange={handleChange} />
        
        <div 
          className={`border-2 border-dashed rounded-2xl p-9 flex flex-col items-center justify-center transition-all cursor-pointer relative overflow-hidden
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
            {file ? `${(file.size / 1024).toFixed(1)} KB — Click to change file` : "or click to browse from your computer"}
          </p>
          {file && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                setAccuracyData(null);
                if (inputRef.current) inputRef.current.value = '';
              }}
              className="mt-3 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-200/80 dark:bg-white/10 hover:bg-red-500/20 text-slate-600 dark:text-slate-300 hover:text-red-500 transition-colors flex items-center gap-1.5 cursor-pointer z-10"
              title="Remove selected file"
            >
              <X size={13} />
              <span>Remove File</span>
            </button>
          )}
        </div>

        {/* Verification / Upload Progress */}
        {checkingAccuracy && (
          <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2.5 text-xs text-amber-500 font-medium">
            <Loader2 size={15} className="animate-spin text-amber-500 flex-shrink-0" />
            <span>Auditing project scope alignment & accuracy against project description...</span>
          </div>
        )}

        {uploading && (
          <div className="mt-5">
            <div className="flex justify-between text-xs theme-muted mb-1 font-mono">
              <span className="flex items-center gap-1.5">
                <Loader2 size={13} className="animate-spin text-[#FF5A14]" />
                <span>
                  {progress < 30 && "Parsing document structure & formatting..."}
                  {progress >= 30 && progress < 60 && "Partitioning into semantic vectors for ChromaDB..."}
                  {progress >= 60 && progress < 88 && "Synthesizing multi-agent project telemetry & risks..."}
                  {progress >= 88 && "Finalizing project knowledge index..."}
                </span>
              </span>
              <span className="font-bold theme-heading">{progress}%</span>
            </div>
            <div className="w-full theme-badge rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-5 flex items-center justify-between">
          <div className="text-[11px] theme-muted flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Scope Accuracy Filter Active</span>
          </div>

          <button
            type="button"
            onClick={handleInitiateUpload}
            disabled={!file || uploading || checkingAccuracy}
            className="px-5 py-2.5 bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white rounded-xl text-xs font-bold shadow-md hover:brightness-110 disabled:opacity-40 transition-all flex items-center gap-2 cursor-pointer"
          >
            {checkingAccuracy ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Auditing Accuracy...</span>
              </>
            ) : uploading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <FileUp size={14} />
                <span>Upload & Process</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Accuracy Warning / Confirmation Modal */}
      <AccuracyWarningModal
        isOpen={isAccuracyModalOpen}
        onClose={handleCancelModal}
        onConfirm={handleConfirmOverride}
        accuracyData={accuracyData}
        isProcessing={uploading}
      />

    </div>
  );
};

export default UploadPanel;
