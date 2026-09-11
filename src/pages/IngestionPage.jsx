import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import UploadPanel from '../components/ingestion/UploadPanel';
import { ingestionApi } from '../api/ingestionApi';
import { 
  FileText, 
  Database, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  HardDrive, 
  RefreshCw,
  Layers,
  FileCode,
  User,
  AlertTriangle,
  FolderKanban
} from 'lucide-react';

const IngestionPage = () => {
  const { user } = useAuth();
  const { activeProject } = useProject();
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const data = await ingestionApi.getHistory(activeProject?.id);
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch ingestion history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [activeProject?.id]);

  if (!['Project Manager', 'PMO'].includes(user?.role)) {
    return (
      <div className="py-12 text-center theme-card p-8 rounded-2xl max-w-md mx-auto">
        <h2 className="text-xl font-bold theme-heading mb-2">Access Denied</h2>
        <p className="text-xs theme-muted">Only PMO and Project Managers have permission to upload and ingest program documents.</p>
      </div>
    );
  }

  const getFormatBadge = (ext) => {
    const clean = (ext || 'TXT').toUpperCase();
    if (clean === 'PDF') return 'bg-red-500/15 text-red-500 border-red-500/30';
    if (clean === 'DOCX') return 'bg-blue-500/15 text-blue-500 border-blue-500/30';
    if (clean === 'XLSX' || clean === 'XLS') return 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30';
    return 'bg-[#FF5A14]/15 text-[#FF7A45] border-[#FF5A14]/30';
  };

  return (
    <div className="py-2 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#FF5A14]/15 text-[#FF5A14] border border-[#FF5A14]/30">
              Data Ops Console
            </span>
            <span className="text-xs theme-muted font-mono">
              ChromaDB Semantic Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black theme-heading tracking-tight">
            Data Ingestion & Semantic Vectorization
          </h1>
          <p className="text-xs sm:text-sm theme-muted mt-1">
            Upload MOMs, contracts, and status reports to calibrate multi-agent telemetry and RAG knowledge vectors.
          </p>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl theme-card border flex items-center gap-3">
            <Database size={16} className="text-[#FF5A14]" />
            <div className="text-left">
              <div className="text-[10px] uppercase font-bold theme-muted">Vector Store</div>
              <div className="text-xs font-black theme-heading">{history.length} Docs Indexed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Layout: Upload Panel on Left / Ingested History on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Upload Dropzone */}
        <div className="lg:col-span-5 space-y-4">
          <UploadPanel onUploadSuccess={() => fetchHistory()} />
          
          {/* Info Card */}
          <div className="p-4 rounded-2xl theme-subtle border theme-border space-y-2">
            <h4 className="text-xs font-bold theme-heading flex items-center gap-1.5">
              <Sparkles size={14} className="text-[#FF5A14]" />
              <span>Multi-Agent Autonomous Pipeline</span>
            </h4>
            <p className="text-[11px] theme-muted leading-relaxed">
              Every document is parsed via <strong>IntakeAgent</strong>, vectorized in 400-token chunks into ChromaDB, and processed through <strong>Financial</strong>, <strong>Risk</strong>, and <strong>Predictive</strong> agents to recalibrate live project health scores.
            </p>
          </div>
        </div>

        {/* Right Column: Ingestion Document History */}
        <div className="lg:col-span-7 space-y-4">
          <div className="theme-card rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 mb-4 border-b theme-border">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-[#FF5A14]" />
                <h3 className="text-base font-bold theme-heading">Recently Ingested Documents</h3>
              </div>
              <button 
                onClick={fetchHistory}
                disabled={loadingHistory}
                className="p-1.5 rounded-lg theme-subtle hover:bg-white/10 text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-xs"
                title="Refresh Ingested Docs"
              >
                <RefreshCw size={13} className={loadingHistory ? "animate-spin" : ""} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>

            {loadingHistory ? (
              <div className="py-12 text-center text-xs theme-muted flex flex-col items-center justify-center gap-2">
                <RefreshCw size={20} className="animate-spin text-[#FF5A14]" />
                <span>Reading ChromaDB vector catalog...</span>
              </div>
            ) : history.length === 0 ? (
              <div className="py-12 text-center text-xs theme-muted italic">
                No documents ingested yet. Upload your first file to index it into semantic memory.
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((doc, idx) => (
                  <div 
                    key={idx} 
                    className="p-3.5 rounded-xl theme-subtle border theme-border hover:border-[#FF5A14]/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="flex items-start gap-3 overflow-hidden">
                      <div className="p-2 rounded-lg bg-[#FF5A14]/10 text-[#FF5A14] flex-shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                        <FileText size={16} />
                      </div>
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold theme-heading truncate max-w-xs sm:max-w-sm block">
                            {doc.filename}
                          </span>
                          <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${getFormatBadge(doc.file_type)}`}>
                            {doc.file_type}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2.5 mt-1 text-[10px] theme-muted font-mono">
                          <span className="flex items-center gap-1">
                            <HardDrive size={11} />
                            <span>{doc.size}</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            <span>{doc.uploaded_at}</span>
                          </span>
                          {doc.uploaded_by && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-slate-400 font-sans">
                                <User size={11} className="text-[#FF5A14]" />
                                <span className="truncate max-w-[140px]">{doc.uploaded_by}</span>
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                      {doc.risks_detected !== undefined && (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          doc.risks_detected > 0 
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          <AlertTriangle size={11} className={doc.risks_detected > 0 ? 'text-amber-400' : 'text-emerald-400'} />
                          <span>{doc.risks_detected > 0 ? `${doc.risks_detected} Risks Found` : 'Clean Doc'}</span>
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>Vector Indexed</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default IngestionPage;
