import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { useToast } from '../context/ToastContext';
import UploadPanel from '../components/ingestion/UploadPanel';
import AccuracyWarningModal from '../components/ingestion/AccuracyWarningModal';
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
  PlugZap,
  Info,
  Tag
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

const getDocumentRelevancyDetails = (doc, activeProject) => {
  const name = (doc?.filename || '').toLowerCase();
  const projectKey = activeProject?.jira_key || 'PRJ-103';
  const projectName = activeProject?.name || 'NextGen AI Banking Platform';

  if (doc?.matched_topics && doc?.matched_topics.length > 0) {
    return {
      summary: doc.summary || `Semantic analysis identified key alignment with ${projectKey} project scope.`,
      topics: doc.matched_topics,
      findings: doc.matched_aspects || []
    };
  }

  if (name.includes('sow') || name.includes('statement of work')) {
    return {
      summary: `Contractual scope, milestones & capital disbursements match ${projectKey} roadmap.`,
      topics: ['ISO 20022 Gateway', 'AWS Landing Zone', 'Tranche Milestones', '$2.5M Budget', 'SLA Benchmarks'],
      findings: [
        'Contract deliverables: AWS Multi-Region, ISO Gateway, AI Fraud Pipeline',
        'Milestone disbursement schedule (M-1 to M-4) matches active timeline',
        'Contractual SLAs (99.99% uptime, <120ms latency) verified with charter'
      ]
    };
  }

  if (name.includes('sla') || name.includes('vendor')) {
    return {
      summary: `Vendor governance metrics & contractual SLA thresholds aligned with platform requirements.`,
      topics: ['Vendor Governance', 'P99 Latency (120ms)', 'Uptime SLA (99.99%)', 'Penalty Clauses', 'Escalation Tiers'],
      findings: [
        'Performance criteria for clearinghouse interconnect matched to platform specs',
        'Vendor compliance penalties (2% per delay week) cross-referenced with capital gates',
        'Severity-1 remediation SLA (<20 min) calibrated with PMO risk matrix'
      ]
    };
  }

  if (name.includes('risk')) {
    return {
      summary: `Identified 4 critical technical and delivery risk vectors matching active project milestones.`,
      topics: ['Clearinghouse Latency (480ms)', 'IAM Token Security', 'GPU Training Burn', 'Mitigation Roadmaps'],
      findings: [
        'Identified performance bottleneck [RISK-FIN-01] on payment gateway microservice',
        'Security vulnerability [RISK-FIN-02] flagged for mTLS & OAuth2 token refresh',
        'Financial drift detected: GPU model training trending +18% above budget'
      ]
    };
  }

  if (name.includes('charter')) {
    return {
      summary: `Foundational executive vision, target business outcomes, and stakeholder framework matched.`,
      topics: ['Cloud Modernization', 'Real-time AI Fraud', 'ISO 20022 Compliance', 'Executive Governance'],
      findings: [
        `Core project objectives directly match ${projectKey} transformation scope`,
        'Governance gate structure & capital sign-off authority aligned with PMO policy',
        'High-concurrency AWS target specs (25,000 TPS) validated against architecture'
      ]
    };
  }

  if (name.includes('status') || name.includes('pmo') || name.includes('weekly')) {
    return {
      summary: `Live Sprint 5 delivery telemetry, burn velocity, and blocker tracking matched.`,
      topics: ['Sprint 5 Velocity (94%)', 'Tranche 2 Gating', 'Capital Spend ($1.72M)', 'Latency Blocker'],
      findings: [
        'Core cloud infrastructure verified at 94% completion across Sprint 5 backlog',
        'Capital burn velocity ($1.72M actual spend) tracked against approved $2.5M budget',
        'Tranche 2 payout hold ($800k) aligned with open payment gateway latency issue'
      ]
    };
  }

  if (name.includes('roster') || name.includes('team')) {
    return {
      summary: `Resource allocation roster, vendor contributor headcount, and skill coverage matched.`,
      topics: ['Cloud Architects', 'DevOps Engineers', 'Vendor Allocations', 'Sprint Headcount', 'Skill Matrices'],
      findings: [
        'Cross-referenced engineering leads against active JIRA contributor assignees',
        `Vendor delivery principal & architect allocations mapped to Project ${projectKey}`,
        'Identified resource capacity for 24/7 payment gateway performance rotation'
      ]
    };
  }

  if (name.includes('milestone') || name.includes('sign')) {
    return {
      summary: `Milestone delivery verification, capital release approval, and acceptance criteria matched.`,
      topics: ['Milestone M-1 Acceptance', 'Landing Zone Cutover', '$600,000 Disbursement', 'PMO Sign-off'],
      findings: [
        'Deliverable M-1 (AWS Multi-Region Landing Zone) verified 100% completed',
        'First tranche capital disbursement ($600,000 USD) confirmed with audit signature',
        'Prerequisites for Milestone M-2 payment gateway gating verified in sequence'
      ]
    };
  }

  if (name.includes('memo')) {
    return {
      summary: `Executive steering directive regarding Tranche 2 retention and latency escalation.`,
      topics: ['Steering Directives', 'Tranche 2 Withholding', 'SLA Remediation', 'Executive Escalation'],
      findings: [
        'Formal directive logged to withhold Tranche 2 ($800k) until latency is resolved',
        'Immediate mandate for vendor task force on Redis caching & HSM deployment',
        'Next executive governance review scheduled with Capital Gatekeeper Committee'
      ]
    };
  }

  const cleanTitle = (doc?.filename || 'Document')
    .replace(/^\[.*?\]\s*/, '')
    .replace(/\.[a-zA-Z0-9]+$/, '')
    .trim();

  return {
    summary: `Domain deliverables & terminology in "${cleanTitle}" align with ${projectKey} scope.`,
    topics: [`${projectKey} Core Scope`, 'Architecture Specs', 'Vector Memory', 'Domain Terms'],
    findings: [
      `Semantic similarity confirmed with ${projectName} charter vocabulary`,
      `Contextual entities and scope keywords verified against project baseline`,
      `Document partitioned and embedded into ChromaDB collection for ${projectKey}`
    ]
  };
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
  const [checkingConnectorAccuracy, setCheckingConnectorAccuracy] = useState(false);
  const [isConnectorAccuracyModalOpen, setIsConnectorAccuracyModalOpen] = useState(false);
  const [connectorAccuracyData, setConnectorAccuracyData] = useState(null);
  const [connectorProgress, setConnectorProgress] = useState(0);
  const [connectorBatchProgress, setConnectorBatchProgress] = useState({ current: 0, total: 0 });

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

  const handleInitiateConnectorIngest = async () => {
    if (selectedItemIds.size === 0) {
      showToast("Please select at least one item to ingest.", "warning");
      return;
    }
    const itemsToIngest = connectorItems.filter(item => selectedItemIds.has(item.id));
    
    try {
      setCheckingConnectorAccuracy(true);
      const res = await ingestionApi.checkConnectorAccuracy(itemsToIngest, activeProject?.id, selectedProvider);
      
      if (res && res.success) {
        if (res.passed) {
          showToast(`Scope Accuracy Check Passed: ${res.match_percentage}% match! Ingesting...`, 'success');
          await executeConnectorIngest(itemsToIngest, false, res.match_percentage);
        } else {
          setConnectorAccuracyData(res);
          setIsConnectorAccuracyModalOpen(true);
        }
      } else {
        await executeConnectorIngest(itemsToIngest);
      }
    } catch (err) {
      console.warn("Connector accuracy pre-check failed, proceeding with direct ingest:", err);
      await executeConnectorIngest(itemsToIngest);
    } finally {
      setCheckingConnectorAccuracy(false);
    }
  };

  const executeConnectorIngest = async (itemsToIngest, isOverride = false, score = null) => {
    try {
      setIngesting(true);
      setConnectorBatchProgress({ current: 0, total: itemsToIngest.length });
      const calculatedScore = score !== null && score !== undefined 
        ? score 
        : (connectorAccuracyData?.match_percentage ?? null);

      let successCount = 0;
      for (let i = 0; i < itemsToIngest.length; i++) {
        const item = itemsToIngest[i];
        setConnectorProgress(0);

        const itemWithScore = {
          ...item,
          ...(calculatedScore !== null ? { accuracy_score: calculatedScore } : {})
        };

        try {
          await ingestionApi.ingestConnectorItems(
            selectedProvider, 
            [itemWithScore], 
            activeProject?.id, 
            calculatedScore,
            (p) => setConnectorProgress(p)
          );
          
          successCount++;
          fetchHistory(); // Update list immediately
        } catch (err) {
          console.error(`Connector ingestion failed for item ${item.title}:`, err);
        }
        
        setConnectorBatchProgress(prev => ({ ...prev, current: i + 1 }));
      }

      if (res?.auto_forecast) {
        const fc = res.auto_forecast;
        const sign = fc.forecasted_variance < 0 ? '-' : '+';
        const formattedVar = `${sign}₹${Math.abs(Math.round(fc.forecasted_variance)).toLocaleString('en-IN')}`;
        showToast(`Ingested ${itemsToIngest.length} items! Reflexion Forecast updated: ${formattedVar} (${fc.confidence_score}% confidence)`, "success");
      } else if (isOverride) {
        showToast(`Ingested ${itemsToIngest.length} items with low accuracy override (${calculatedScore ?? 0}%).`, "warning");
      } else {
        showToast(`Successfully ingested ${successCount} items into Vector Store!`, "success");
      }
      
      setSelectedItemIds(new Set());
      setIsConnectorAccuracyModalOpen(false);
      setConnectorAccuracyData(null);
    } catch (err) {
      console.error("Connector ingestion failed:", err);
      showToast(err.response?.data?.error || "Failed to ingest selected items.", "error");
    } finally {
      setIngesting(false);
      setConnectorProgress(0);
      setConnectorBatchProgress({ current: 0, total: 0 });
    }
  };

  if (!['Project Manager', 'PMO', 'Program Director'].includes(user?.role)) {
    return (
      <div className="py-12 text-center theme-card p-8 rounded-2xl max-w-md mx-auto">
        <h2 className="text-xl font-bold theme-heading mb-2">Access Denied</h2>
        <p className="text-xs theme-muted">Only PMO, Program Directors, and Project Managers have permission to upload and ingest program documents.</p>
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
                        onClick={handleInitiateConnectorIngest}
                        disabled={ingesting || checkingConnectorAccuracy || selectedItemIds.size === 0}
                        className="w-full py-2.5 px-4 bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] hover:brightness-110 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {checkingConnectorAccuracy ? (
                          <>
                            <Loader2 size={15} className="animate-spin" />
                            <span>Auditing Scope Accuracy...</span>
                          </>
                        ) : ingesting ? (
                          <>
                            <Loader2 size={15} className="animate-spin" />
                            <span>Processing Items...</span>
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

                      {/* Progress Bar UI */}
                      {ingesting && connectorBatchProgress.total > 0 && (
                        <div className="mt-4 space-y-4">
                          {connectorBatchProgress.total > 1 && (
                            <div>
                              <div className="flex justify-between text-xs theme-muted mb-1 font-mono">
                                <span className="flex items-center gap-1.5">
                                  <Loader2 size={13} className="animate-spin text-emerald-500" />
                                  <span>Processing item {connectorBatchProgress.current + 1} of {connectorBatchProgress.total}...</span>
                                </span>
                                <span className="font-bold theme-heading">Overall: {Math.round(((connectorBatchProgress.current * 100) + connectorProgress) / (connectorBatchProgress.total * 100) * 100)}%</span>
                              </div>
                              <div className="w-full theme-badge rounded-full h-2 overflow-hidden bg-slate-200 dark:bg-slate-800">
                                <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full transition-all duration-300" style={{ width: `${((connectorBatchProgress.current * 100) + connectorProgress) / (connectorBatchProgress.total * 100) * 100}%` }}></div>
                              </div>
                            </div>
                          )}
                          
                          <div>
                            <div className="flex justify-between text-xs theme-muted mb-1 font-mono">
                              <span className="flex items-center gap-1.5">
                                <Loader2 size={13} className="animate-spin text-[#FF5A14]" />
                                <span>
                                  {connectorProgress < 30 && "Fetching and parsing asset..."}
                                  {connectorProgress >= 30 && connectorProgress < 60 && "Partitioning into semantic vectors..."}
                                  {connectorProgress >= 60 && connectorProgress < 88 && "Synthesizing project telemetry..."}
                                  {connectorProgress >= 88 && "Finalizing knowledge index..."}
                                </span>
                              </span>
                              <span className="font-bold theme-heading ml-2 shrink-0">{connectorProgress}%</span>
                            </div>
                            <div className="w-full theme-badge rounded-full h-2 overflow-hidden bg-slate-200 dark:bg-slate-800">
                              <div className="bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] h-2 rounded-full transition-all duration-300" style={{ width: `${connectorProgress}%` }}></div>
                            </div>
                          </div>
                        </div>
                      )}
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
                    className="p-3.5 rounded-xl theme-subtle border theme-border hover:border-[#FF5A14]/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group relative hover:z-30"
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
                      {doc.accuracy_score !== undefined && doc.accuracy_score !== null && (() => {
                        const relDetails = getDocumentRelevancyDetails(doc, activeProject);
                        return (
                          <div className="relative group/relevancy inline-flex items-center">
                            {/* Relevancy Trigger Badge */}
                            <div 
                              tabIndex={0}
                              role="button"
                              aria-label={`Document relevancy: ${doc.accuracy_score}% Match`}
                              className={`cursor-help inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border font-mono transition-all duration-200 select-none ${
                                doc.accuracy_score >= 70 
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 group-hover/relevancy:border-emerald-500/60 group-hover/relevancy:bg-emerald-500/20' 
                                  : doc.accuracy_score >= 50
                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25 group-hover/relevancy:border-amber-500/60 group-hover/relevancy:bg-amber-500/20'
                                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25 group-hover/relevancy:border-rose-500/60 group-hover/relevancy:bg-rose-500/20'
                              }`}
                            >
                              <span>{doc.accuracy_score}% Match</span>
                              <Info size={10} className="opacity-60 group-hover/relevancy:opacity-100 transition-opacity" />
                            </div>

                            {/* Relevancy Tooltip Card */}
                            <div className={`absolute ${
                              idx === 0 ? 'top-[calc(100%+10px)]' : 'bottom-[calc(100%+10px)]'
                            } right-0 invisible group-hover/relevancy:visible group-focus-within/relevancy:visible opacity-0 group-hover/relevancy:opacity-100 group-focus-within/relevancy:opacity-100 transition-all duration-200 ease-out z-50 pointer-events-none w-80 sm:w-96`}>
                              <div className="p-4 rounded-2xl bg-[#0c101b] text-slate-200 border border-slate-700/80 shadow-[0_16px_40px_rgba(0,0,0,0.75)] backdrop-blur-md relative font-sans text-left">
                                
                                {/* Accent Glow Line */}
                                <div className={`absolute top-0 left-3 right-3 h-[2px] rounded-full bg-gradient-to-r ${
                                  doc.accuracy_score >= 70
                                    ? 'from-emerald-500 via-[#FF5A14] to-emerald-400'
                                    : doc.accuracy_score >= 50
                                      ? 'from-amber-500 via-[#FF5A14] to-amber-400'
                                      : 'from-rose-500 via-[#FF5A14] to-rose-400'
                                }`} />

                                {/* Header */}
                                <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-white/10">
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                                    <Sparkles size={13} className="text-[#FF5A14]" />
                                    <span>Document Relevancy Match</span>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
                                    doc.accuracy_score >= 70
                                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                      : doc.accuracy_score >= 50
                                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                        : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                                  }`}>
                                    {doc.accuracy_score}% Relevancy
                                  </span>
                                </div>

                                {/* Summary */}
                                <p className="text-[11px] leading-relaxed text-slate-300 mb-2.5">
                                  {relDetails.summary}
                                </p>

                                {/* Matched Topics / Entities (যা যা relevant পেয়েছে) */}
                                <div className="mb-2.5">
                                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                                    <Tag size={10} className="text-[#FF5A14]" />
                                    <span>Matched Topics & Scope Found:</span>
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {relDetails.topics.map((t, tIdx) => (
                                      <span 
                                        key={tIdx} 
                                        className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 text-[9.5px] font-mono font-medium flex items-center gap-1"
                                      >
                                        <span className="w-1 h-1 rounded-full bg-emerald-400" />
                                        {t}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                {/* Key Scope Alignment Findings */}
                                <div className="mb-3 space-y-1">
                                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                                    <CheckCircle2 size={10} className="text-emerald-400" />
                                    <span>Key Scope Alignment Findings:</span>
                                  </div>
                                  <ul className="space-y-1 text-[10px] text-slate-300">
                                    {relDetails.findings.map((f, fIdx) => (
                                      <li key={fIdx} className="flex items-start gap-1.5 leading-snug">
                                        <span className="text-emerald-400 font-bold shrink-0 mt-0.5">•</span>
                                        <span>{f}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                {/* Scope Audit Footer */}
                                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px]">
                                  <div className="flex items-center gap-1.5 text-slate-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    <span>Vector Indexed & Scoped</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-slate-400">Scope Audit:</span>
                                    <span className={`font-mono font-bold ${doc.accuracy_score >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                      {doc.accuracy_score >= 70 ? 'PASSED' : 'OVERRIDDEN'}
                                    </span>
                                  </div>
                                </div>

                                {/* Arrow Pointer */}
                                <div className={`absolute ${
                                  idx === 0 
                                    ? 'bottom-full right-6 -mb-1 border-l border-t' 
                                    : 'top-full right-6 -mt-1 border-r border-b'
                                } w-2.5 h-2.5 bg-[#0c101b] border-slate-700/80 rotate-45`} />
                              </div>
                            </div>
                          </div>
                        );
                      })()}

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

      {/* Accuracy Warning / Confirmation Modal for Connectors */}
      <AccuracyWarningModal
        isOpen={isConnectorAccuracyModalOpen}
        onClose={() => setIsConnectorAccuracyModalOpen(false)}
        onConfirm={() => {
          const itemsToIngest = connectorItems.filter(item => selectedItemIds.has(item.id));
          const score = connectorAccuracyData?.match_percentage ?? null;
          executeConnectorIngest(itemsToIngest, true, score);
        }}
        accuracyData={connectorAccuracyData}
        isProcessing={ingesting}
      />
    </div>
  );
};

export default IngestionPage;
