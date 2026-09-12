import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { useToast } from '../context/ToastContext';
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
  User,
  AlertTriangle,
  FolderKanban,
  Upload,
  Server,
  GitBranch,
  Cloud,
  CheckSquare,
  Square,
  ExternalLink,
  ChevronRight,
  Loader2,
  PlugZap
} from 'lucide-react';

const CONNECTOR_METADATA = {
  jira: {
    name: 'Jira Cloud',
    icon: Server,
    color: 'text-blue-500',
    borderColor: 'border-blue-500/30',
    bgColor: 'bg-blue-500/10',
    activeBg: 'bg-blue-500 text-white'
  },
  azure_devops: {
    name: 'Azure DevOps',
    icon: GitBranch,
    color: 'text-sky-500',
    borderColor: 'border-sky-500/30',
    bgColor: 'bg-sky-500/10',
    activeBg: 'bg-sky-500 text-white'
  },
  google_drive: {
    name: 'Google Drive',
    icon: HardDrive,
    color: 'text-emerald-500',
    borderColor: 'border-emerald-500/30',
    bgColor: 'bg-emerald-500/10',
    activeBg: 'bg-emerald-500 text-white'
  },
  onedrive: {
    name: 'Microsoft OneDrive',
    icon: Cloud,
    color: 'text-indigo-400',
    borderColor: 'border-indigo-500/30',
    bgColor: 'bg-indigo-500/10',
    activeBg: 'bg-indigo-500 text-white'
  }
};

const IngestionPage = () => {
  const { user } = useAuth();
  const { activeProject } = useProject();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Ingestion history state
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Ingestion mode: 'manual' (file upload) vs 'connector' (connected tools import)
  const [activeSource, setActiveSource] = useState('manual');

  // Connector import states
  const [connectors, setConnectors] = useState([]);
  const [loadingConnectors, setLoadingConnectors] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('jira');
  const [connectorItems, setConnectorItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [selectedItemIds, setSelectedItemIds] = useState(new Set());
  const [ingesting, setIngesting] = useState(false);

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

  const loadConnectors = async () => {
    if (!activeProject?.id) return;
    try {
      setLoadingConnectors(true);
      const res = await ingestionApi.getProjectConnectors(activeProject.id);
      if (res && res.connectors) {
        setConnectors(res.connectors);
        // Default selected provider to first connected connector if available
        const connectedFirst = res.connectors.find(c => c.is_connected);
        if (connectedFirst && !selectedProvider) {
          setSelectedProvider(connectedFirst.id);
        }
      }
    } catch (err) {
      console.error("Failed to load project connectors:", err);
    } finally {
      setLoadingConnectors(false);
    }
  };

  const loadConnectorData = async (provider = selectedProvider) => {
    if (!activeProject?.id || !provider) return;
    try {
      setLoadingItems(true);
      setFetchError(null);
      setSelectedItemIds(new Set());
      const res = await ingestionApi.fetchConnectorData(provider, activeProject.id);
      if (res && res.items) {
        setConnectorItems(res.items);
      } else {
        setConnectorItems([]);
      }
    } catch (err) {
      console.error("Failed to fetch connector data:", err);
      const msg = err.response?.data?.error || `Failed to fetch data from ${provider}.`;
      setFetchError(msg);
      setConnectorItems([]);
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    loadConnectors();
  }, [activeProject?.id]);

  useEffect(() => {
    if (activeSource === 'connector' && selectedProvider) {
      loadConnectorData(selectedProvider);
    }
  }, [selectedProvider, activeSource, activeProject?.id]);

  const handleToggleSelectItem = (id) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedItemIds.size === connectorItems.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(connectorItems.map(item => item.id)));
    }
  };

  const handleIngestSelected = async () => {
    if (selectedItemIds.size === 0) {
      showToast("Please select at least one item to ingest.", "warning");
      return;
    }
    const itemsToIngest = connectorItems.filter(item => selectedItemIds.has(item.id));
    try {
      setIngesting(true);
      const res = await ingestionApi.ingestConnectorItems(selectedProvider, itemsToIngest, activeProject?.id);
      showToast(res.message || `Successfully ingested ${itemsToIngest.length} items into Vector Store!`, "success");
      setSelectedItemIds(new Set());
      fetchHistory();
    } catch (err) {
      console.error("Connector ingestion failed:", err);
      showToast(err.response?.data?.error || "Failed to ingest selected items.", "error");
    } finally {
      setIngesting(false);
    }
  };

  if (!['Project Manager', 'PMO', 'Program Director'].includes(user?.role)) {
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
    if (clean === 'JIRA') return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    if (clean === 'ADO') return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
    if (clean === 'GOOGLE_DRIVE' || clean === 'GDRIVE' || clean === 'GDOC') return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    if (clean === 'ONEDRIVE' || clean === 'M365') return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30';
    return 'bg-[#FF5A14]/15 text-[#FF7A45] border-[#FF5A14]/30';
  };

  const connectedCount = connectors.filter(c => c.is_connected).length;
  const currentConnectorObj = connectors.find(c => c.id === selectedProvider);
  const isSelectedConnected = currentConnectorObj?.is_connected;

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
              ChromaDB Semantic Engine • Scoped to [{activeProject?.jira_key || 'PRJ'}]
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black theme-heading tracking-tight">
            Data Ingestion & Semantic Vectorization
          </h1>
          <p className="text-xs sm:text-sm theme-muted mt-1">
            Ingest manual MOMs or live connector assets (Jira, Azure DevOps, Google Drive, OneDrive) into project-partitioned vector memory.
          </p>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl theme-card border flex items-center gap-3 shadow-sm">
            <Database size={16} className="text-[#FF5A14]" />
            <div className="text-left">
              <div className="text-[10px] uppercase font-bold theme-muted">Vector Store</div>
              <div className="text-xs font-black theme-heading">{history.length} Docs Indexed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Layout: Ingestion Source Console on Left / Ingested History on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Dual-Source Ingestion Console (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Ingestion Source Switcher Tabs */}
          <div className="p-1 rounded-2xl bg-slate-100 dark:bg-slate-900/80 border theme-border flex items-center gap-1 shadow-inner">
            <button
              type="button"
              onClick={() => setActiveSource('manual')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeSource === 'manual'
                  ? 'bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Upload size={15} />
              <span>Manual File Upload</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSource('connector')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeSource === 'connector'
                  ? 'bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <PlugZap size={15} />
              <span>Import from Connectors</span>
              {connectedCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  {connectedCount} Active
                </span>
              )}
            </button>
          </div>

          {/* Mode 1: Manual File Upload Dropzone */}
          {activeSource === 'manual' ? (
            <div className="space-y-4">
              <UploadPanel onUploadSuccess={() => fetchHistory()} />
              
              <div className="p-4 rounded-2xl theme-subtle border theme-border space-y-2">
                <h4 className="text-xs font-bold theme-heading flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[#FF5A14]" />
                  <span>Multi-Agent Autonomous Pipeline</span>
                </h4>
                <p className="text-[11px] theme-muted leading-relaxed">
                  Uploaded files are parsed via <strong>IntakeAgent</strong>, vectorized in 400-token chunks with metadata <code className="font-mono text-[#FF5A14]">project_id: {activeProject?.id || 1}</code>, and indexed into ChromaDB.
                </p>
              </div>
            </div>
          ) : (
            /* Mode 2: Enterprise Connector Live Ingestion Console */
            <div className="space-y-4">
              <div className="theme-card rounded-2xl p-5 border theme-border shadow-sm space-y-4">
                
                {/* Header of Connector Ingestion Card */}
                <div className="flex items-center justify-between pb-3 border-b theme-border">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[#FF5A14]/15 text-[#FF5A14] font-bold">
                      <Server size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold theme-heading">Connected Tools Ingestion</h3>
                      <p className="text-[11px] theme-muted">Select connector to fetch and vectorize live project assets</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => loadConnectorData(selectedProvider)}
                    disabled={loadingItems || !isSelectedConnected}
                    className="p-1.5 rounded-lg theme-subtle hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                    title="Refresh Connector Data"
                  >
                    <RefreshCw size={14} className={loadingItems ? "animate-spin text-[#FF5A14]" : ""} />
                  </button>
                </div>

                {/* Compact Connector Selector Pills for Active Project */}
                <div>
                  <label className="text-[11px] font-bold theme-muted uppercase tracking-wider block mb-2">
                    Project Connectors [{activeProject?.jira_key || 'PRJ'}]:
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    {connectors.map((conn) => {
                      const meta = CONNECTOR_METADATA[conn.id] || {
                        name: conn.name,
                        icon: Server,
                        color: 'text-[#FF5A14]',
                        borderColor: 'border-[#FF5A14]/30',
                        bgColor: 'bg-[#FF5A14]/10'
                      };
                      const Icon = meta.icon;
                      const isSelected = selectedProvider === conn.id;

                      return (
                        <button
                          key={conn.id}
                          type="button"
                          onClick={() => setSelectedProvider(conn.id)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                            isSelected 
                              ? 'bg-[#FF5A14] text-white border-[#FF5A14] shadow-md shadow-[#FF5A14]/20 scale-[1.01]' 
                              : 'theme-subtle hover:theme-subtle-hover theme-border'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 truncate">
                              <Icon size={16} className={isSelected ? 'text-white' : meta.color} />
                              <span className="text-xs font-bold truncate">{conn.name}</span>
                            </div>
                            <span 
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                conn.is_connected 
                                  ? (isSelected ? 'bg-emerald-300 ring-2 ring-white/40 animate-pulse' : 'bg-emerald-500 ring-2 ring-emerald-500/20 animate-pulse') 
                                  : (isSelected ? 'bg-white/30' : 'bg-slate-400/40')
                              }`} 
                              title={conn.is_connected ? "Connected" : "Disconnected"}
                            />
                          </div>

                          <span className={`text-[10px] font-medium truncate ${isSelected ? 'text-white/80' : 'theme-muted'}`}>
                            {conn.is_connected ? 'Connected' : 'Not Connected'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Provider Live Data Fetch & Checkbox Selection Area */}
                <div className="pt-2 border-t theme-border space-y-3">
                  
                  {!isSelectedConnected ? (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center space-y-2">
                      <AlertTriangle size={20} className="text-amber-500 mx-auto" />
                      <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400">
                        {CONNECTOR_METADATA[selectedProvider]?.name || 'Connector'} is Disconnected
                      </h4>
                      <p className="text-[11px] theme-muted">
                        Configure connection and credentials for Project [{activeProject?.jira_key || 'PRJ'}] in Connectors Hub first.
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate('/settings')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FF5A14] hover:bg-[#FF7A45] text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer mt-1"
                      >
                        <span>Go to Connectors Hub</span>
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  ) : loadingItems ? (
                    <div className="py-10 text-center space-y-2">
                      <Loader2 size={24} className="animate-spin text-[#FF5A14] mx-auto" />
                      <div className="text-xs font-bold theme-heading">
                        Fetching live data from {CONNECTOR_METADATA[selectedProvider]?.name}...
                      </div>
                      <div className="text-[10px] theme-muted">
                        Scoping to Project: {activeProject?.name}
                      </div>
                    </div>
                  ) : fetchError ? (
                    <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-500 flex items-start gap-2">
                      <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                      <div>
                        <strong>Fetch Failed:</strong> {fetchError}
                      </div>
                    </div>
                  ) : connectorItems.length === 0 ? (
                    <div className="py-8 text-center text-xs theme-muted italic">
                      No assets found for Project [{activeProject?.jira_key || 'PRJ'}] in this connector.
                    </div>
                  ) : (
                    /* Live Items Checkbox Table / List */
                    <div className="space-y-3">
                      {/* Selection Toolbar */}
                      <div className="flex items-center justify-between text-xs py-1">
                        <button
                          type="button"
                          onClick={handleSelectAll}
                          className="flex items-center gap-1.5 font-bold theme-heading hover:text-[#FF5A14] transition-colors cursor-pointer"
                        >
                          {selectedItemIds.size === connectorItems.length ? (
                            <CheckSquare size={16} className="text-[#FF5A14]" />
                          ) : (
                            <Square size={16} className="theme-muted" />
                          )}
                          <span>
                            {selectedItemIds.size === connectorItems.length ? "Deselect All" : "Select All"}
                          </span>
                        </button>

                        <span className="text-[11px] font-mono theme-muted">
                          {selectedItemIds.size} of {connectorItems.length} selected
                        </span>
                      </div>

                      {/* Items Scrollable List */}
                      <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {connectorItems.map((item) => {
                          const isChecked = selectedItemIds.has(item.id);
                          return (
                            <div
                              key={item.id}
                              onClick={() => handleToggleSelectItem(item.id)}
                              className={`p-2.5 rounded-xl border text-xs transition-all cursor-pointer flex items-start gap-3 ${
                                isChecked
                                  ? 'bg-[#FF5A14]/10 border-[#FF5A14]/40 shadow-sm'
                                  : 'theme-subtle hover:border-slate-400/40 theme-border'
                              }`}
                            >
                              <div className="mt-0.5 shrink-0 text-[#FF5A14]">
                                {isChecked ? <CheckSquare size={16} /> : <Square size={16} className="theme-muted" />}
                              </div>

                              <div className="overflow-hidden flex-1 space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-bold theme-heading truncate block">
                                    {item.title}
                                  </span>
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-500/15 theme-heading border theme-border shrink-0">
                                    {item.id}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 text-[10px] theme-muted font-mono">
                                  <span className="px-1.5 py-0.2 rounded bg-[#FF5A14]/10 text-[#FF7A45] font-semibold">
                                    {item.type}
                                  </span>
                                  <span>•</span>
                                  <span className="text-emerald-500 font-semibold truncate">
                                    {item.status}
                                  </span>
                                  <span>•</span>
                                  <span className="text-slate-400">
                                    {item.priority || item.size}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Action Button: Ingest & Vectorize Selected */}
                      <button
                        type="button"
                        onClick={handleIngestSelected}
                        disabled={ingesting || selectedItemIds.size === 0}
                        className="w-full py-2.5 px-4 bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] hover:brightness-110 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {ingesting ? (
                          <>
                            <Loader2 size={15} className="animate-spin" />
                            <span>Partitioning & Vectorizing into ChromaDB...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={15} />
                            <span>
                              Ingest & Vectorize Selected ({selectedItemIds.size})
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                </div>

              </div>

              {/* Info Callout */}
              <div className="p-3.5 rounded-2xl theme-subtle border theme-border text-[11px] theme-muted flex items-start gap-2">
                <Database size={15} className="text-[#FF5A14] shrink-0 mt-0.5" />
                <span>
                  Ingested items are chunked and partitioned by <strong className="theme-heading">project_id: {activeProject?.id || 1}</strong> in ChromaDB and cataloged in the <strong className="theme-heading">uploaded_documents</strong> database table.
                </span>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Ingestion Document History (7 cols) */}
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
                className="p-1.5 rounded-lg theme-subtle hover:bg-white/10 text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-xs cursor-pointer"
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
                No documents ingested yet for Project [{activeProject?.jira_key || 'PRJ'}]. Upload a local file or import from connected tools to index into vector memory.
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
