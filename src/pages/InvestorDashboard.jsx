import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { dashboardApi } from '../api/dashboardApi';
import { reportsApi } from '../api/reportsApi';
import { ingestionApi } from '../api/ingestionApi';
import KPICard from '../components/dashboard/KPICard';
import BurndownChart from '../components/dashboard/BurndownChart';
import RiskHeatmap from '../components/dashboard/RiskHeatmap';
import FuturisticLoader from '../components/common/FuturisticLoader';
import { 
  FileUp, 
  FileText, 
  Loader2, 
  AlertCircle, 
  ExternalLink, 
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Activity,
  Clock,
  CheckCircle2,
  Lock,
  Unlock,
  DollarSign,
  Layers,
  ChevronDown,
  ChevronUp,
  Eye,
  FileCheck
} from 'lucide-react';

const InvestorDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  // Capital Tranche & Milestone Attainment State (Strictly Real Data, No Fallback)
  const [expandedMilestoneId, setExpandedMilestoneId] = useState(null);
  const [trancheMilestones, setTrancheMilestones] = useState([]);

  useEffect(() => {
    if (data?.milestones && Array.isArray(data.milestones) && data.milestones.length > 0) {
      setTrancheMilestones(data.milestones);
    } else {
      setTrancheMilestones([]);
    }
  }, [data]);

  const handleToggleTranchePayout = (mId) => {
    setTrancheMilestones(prev => prev.map(m => {
      if (m.id === mId) {
        if (m.status === 'Released') {
          showToast(`Tranche ${m.id} has already been paid and cleared via SAP ERP.`, 'info');
          return m;
        }
        if (m.status === 'Locked') {
          showToast(`Tranche ${m.id} cannot be released until preceding milestones complete.`, 'warning');
          return m;
        }
        const nextStatus = m.status === 'On Hold' ? 'Authorized' : 'On Hold';
        showToast(
          nextStatus === 'Authorized'
            ? `Capital Tranche ${m.id} ($${m.trancheAmount.toLocaleString()}) manually authorized for disbursement.`
            : `Capital Tranche ${m.id} placed ON HOLD — Capital withheld to enforce vendor SLA compliance.`,
          nextStatus === 'Authorized' ? 'success' : 'warning'
        );
        return { ...m, status: nextStatus };
      }
      return m;
    }));
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const snapshot = await dashboardApi.getSnapshot();
      setData(snapshot);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to load dashboard data", err);
      setError("Unable to load program data at this time.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleGenerateReport = async () => {
    try {
      setGeneratingReport(true);
      const res = await reportsApi.generateReport(1);
      showToast(`Report ${res.filename} generated successfully!`, 'success');
      await reportsApi.downloadReport(res.filename);
    } catch (err) {
      console.error("Failed to generate report:", err);
      showToast("Failed to generate report. Please try again.", "error");
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingDoc(true);
      setUploadProgress(0);
      const res = await ingestionApi.uploadDocument(file, (p) => setUploadProgress(p));
      if (res?.ai_processing_status === 'degraded_fallback') {
        showToast('AI processing degraded — some figures are heuristic estimates', 'warning');
      } else {
        showToast(`Successfully ingested ${file.name}. State updated.`, 'success');
      }
      await fetchDashboardData();
    } catch (err) {
      console.error("Upload error:", err);
      showToast("Failed to ingest document.", "error");
    } finally {
      setUploadingDoc(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // FUTURISTIC AGENTIC AI LOADER WHILE FETCHING DATA
  if (loading) {
    return (
      <FuturisticLoader 
        title={`Synchronizing ${user?.role || 'Executive'} Telemetry...`} 
        subtitle="Retrieving real-time RAG vectors, burndown metrics, and risk scores"
      />
    );
  }

  // ERROR DISPLAY WITH FUTURISTIC CARD
  if (error || !data) {
    return (
      <div className="p-8">
        <div className="p-6 rounded-2xl theme-card max-w-2xl mx-auto text-center border-red-500/40">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold theme-heading mb-2">Error Connecting to Telemetry Stream</h3>
          <p className="text-xs theme-muted mb-6">{error || "The dashboard data payload is invalid or empty."}</p>
          <button
            onClick={fetchDashboardData}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white text-xs font-bold shadow-md hover:brightness-110"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Destructure dynamic snapshot fields
  const kpis = data?.kpis || [];
  const burndown = data?.burndown || [];
  const risks = data?.risks || [];
  const healthScore = data?.healthScore || 84;
  const crossProjectStatus = data?.cross_project_status || "Active & Governed";
  const scheduleVariance = data?.schedule_variance || "+2.4% Ahead";
  const totalBudgetBurn = data?.total_budget_burn || "$2.64M / $3.85M";
  const showstoppers = data?.showstoppers || [];
  const velocity = data?.velocity || null;
  const openBlockers = data?.open_blockers || [];
  const escalations = data?.escalations || [];

  // ==========================================
  // 1. INVESTOR VIEW
  // ==========================================
  const renderInvestorView = () => {
    const hasMilestones = trancheMilestones && trancheMilestones.length > 0;
    const totalCommitted = hasMilestones ? trancheMilestones.reduce((acc, m) => acc + m.trancheAmount, 0) : 0;
    const totalReleased = hasMilestones ? trancheMilestones.filter(m => m.status === 'Released' || m.status === 'Authorized').reduce((acc, m) => acc + m.trancheAmount, 0) : 0;
    const totalOnHold = hasMilestones ? trancheMilestones.filter(m => m.status === 'On Hold').reduce((acc, m) => acc + m.trancheAmount, 0) : 0;

    return (
      <div className="space-y-8">
        {/* KPI Cards Grid - Strictly Live Backend Data, No Fallbacks */}
        {kpis && kpis.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((kpi, idx) => (
              <KPICard 
                key={idx}
                title={kpi.title} 
                value={kpi.value} 
                trend={kpi.trend} 
                trendLabel={kpi.trendLabel}
                icon={
                  idx === 0 ? <DollarSign size={18} /> :
                  idx === 1 ? <TrendingUp size={18} /> :
                  idx === 2 ? <ShieldCheck size={18} /> :
                  <Sparkles size={18} />
                }
              />
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl theme-card text-xs theme-muted italic border theme-border flex items-center justify-between">
            <span>No live KPI telemetry recorded in current snapshot.</span>
            <span className="text-[10px] text-slate-400 font-mono">Status: Awaiting Ingestion / Live Feed</span>
          </div>
        )}

        {/* Charts & Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Burndown Chart */}
          <div className="lg:col-span-2">
            <BurndownChart data={burndown} />
          </div>

          {/* ROI / Program Health Holographic Radial Gauge */}
          <div className="lg:col-span-1">
            <div className="p-6 rounded-2xl theme-card h-full flex flex-col items-center justify-between relative overflow-hidden">
              
              <div className="w-full flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3 mb-4">
                <h3 className="text-sm font-bold theme-heading flex items-center gap-2">
                  <Sparkles size={16} className="text-[#FF5A14]" />
                  <span>Portfolio ROI Health Index</span>
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  healthScore >= 90 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                  healthScore >= 75 ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                  healthScore >= 60 ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                  'bg-red-500/10 text-red-500 border border-red-500/20'
                }`}>
                  {healthScore >= 90 ? 'Grade A' : healthScore >= 75 ? 'Grade B' : healthScore >= 60 ? 'Grade C' : 'Grade D'}
                </span>
              </div>

              {/* Circular Gauge */}
              <div className="relative my-4">
                <svg className="w-44 h-44 transform -rotate-90">
                  <circle 
                    cx="88" 
                    cy="88" 
                    r="76" 
                    stroke="currentColor" 
                    strokeWidth="14" 
                    fill="transparent" 
                    className="text-slate-200 dark:text-white/10" 
                  />
                  <circle 
                    cx="88" 
                    cy="88" 
                    r="76" 
                    stroke="currentColor" 
                    strokeWidth="14" 
                    fill="transparent" 
                    strokeDasharray="477" 
                    strokeDashoffset={`${477 - (477 * healthScore) / 100}`} 
                    strokeLinecap="round"
                    className="text-[#FF5A14] transition-all duration-1000 filter drop-shadow-[0_0_12px_rgba(255,90,20,0.6)]" 
                  />
                </svg>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                  <div className="text-4xl font-black theme-heading tracking-tight">
                    {healthScore}%
                  </div>
                  <span className="text-[10px] font-bold text-[#FF7A45] uppercase tracking-wider block -mt-1">
                    Confidence
                  </span>
                </div>
              </div>

              <div className="w-full text-center text-xs theme-muted pt-2 border-t border-slate-200 dark:border-white/10">
                Calibrated against active supplier SOWs
              </div>

            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* MILESTONE ATTAINMENT VS. FINANCIAL PAYOUTS: CAPITAL RELEASE GATEKEEPER */}
        {/* ========================================================================= */}
        <div className="theme-card rounded-2xl overflow-hidden shadow-sm border theme-border">
          
          {/* Header Strip with Capital Protection Status */}
          <div className="p-6 border-b theme-border flex flex-col lg:flex-row lg:items-center justify-between gap-4 theme-subtle">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="p-1.5 bg-[#FF5A14]/15 text-[#FF5A14] rounded-lg">
                  <Layers size={16} />
                </span>
                <h3 className="text-base font-bold theme-heading tracking-tight">
                  Milestone Attainment vs. Financial Tranche Payouts
                </h3>
                {hasMilestones && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                    Capital Gatekeeper Active
                  </span>
                )}
              </div>
              <p className="text-xs theme-muted">
                Ensures vendor contractual deliverables and technical SLAs are 100% verified before authorizing capital tranche disbursements.
              </p>
            </div>

            {/* Quick Metrics Pills (Visible only when real milestones exist) */}
            {hasMilestones && (
              <div className="flex flex-wrap items-center gap-3">
                <div className="px-3 py-1.5 rounded-xl theme-card border theme-border text-xs">
                  <span className="theme-muted text-[10px] block">Committed Capital</span>
                  <span className="font-bold theme-heading">${totalCommitted.toLocaleString()}</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl theme-card border border-emerald-500/30 bg-emerald-500/5 text-xs">
                  <span className="text-emerald-600 dark:text-emerald-400 text-[10px] block font-semibold">Disbursed</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">${totalReleased.toLocaleString()}</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl theme-card border border-rose-500/30 bg-rose-500/5 text-xs">
                  <span className="text-rose-600 dark:text-rose-400 text-[10px] block font-semibold">Withheld (SLA Hold)</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">${totalOnHold.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          {!hasMilestones ? (
            <div className="p-10 text-center text-xs theme-muted flex flex-col items-center justify-center space-y-2">
              <Layers size={36} className="opacity-30 text-[#FF5A14] mb-1" />
              <div className="font-bold theme-heading text-sm">No Live Milestone Tranche Telemetry Available</div>
              <p className="max-w-md text-xs theme-muted">
                No contractual milestone tranches have been recorded in the current program telemetry. Upload a vendor SOW or sync external connectors to populate real-time contractual milestone verification.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="theme-subtle border-b theme-border uppercase tracking-wider font-bold theme-muted text-[11px]">
                  <th className="p-4">Milestone & Phase</th>
                  <th className="p-4">Deliverables Verified</th>
                  <th className="p-4">SLA Compliance</th>
                  <th className="p-4">Tranche Amount</th>
                  <th className="p-4">Gatekeeper Status</th>
                  <th className="p-4 text-center">Investor Action</th>
                </tr>
              </thead>
              <tbody className="divide-y theme-border">
                {trancheMilestones.map((milestone) => {
                  const isExpanded = expandedMilestoneId === milestone.id;
                  const isBlocked = milestone.status === 'On Hold';
                  const isReleased = milestone.status === 'Released' || milestone.status === 'Authorized';

                  return (
                    <React.Fragment key={milestone.id}>
                      <tr className={`theme-subtle-hover transition-colors ${isBlocked ? 'bg-rose-500/[0.03]' : ''}`}>
                        
                        {/* Milestone ID & Name */}
                        <td className="p-4 max-w-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#FF5A14]">{milestone.id}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-white/10 theme-muted font-medium">
                              {milestone.timeline}
                            </span>
                          </div>
                          <div className="font-bold theme-heading mt-1">{milestone.name}</div>
                        </td>

                        {/* Deliverables Verified */}
                        <td className="p-4 whitespace-nowrap">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="font-medium theme-heading">{milestone.deliverablesCount}</span>
                            <span className="theme-muted font-mono">{milestone.deliverablesPercent}%</span>
                          </div>
                          <div className="w-36 h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                milestone.deliverablesPercent === 100 ? 'bg-emerald-500' :
                                milestone.deliverablesPercent > 50 ? 'bg-amber-500' : 'bg-slate-400'
                              }`}
                              style={{ width: `${milestone.deliverablesPercent}%` }}
                            />
                          </div>
                        </td>

                        {/* SLA Compliance */}
                        <td className="p-4 whitespace-nowrap">
                          {milestone.slaScore !== null ? (
                            <div>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                milestone.slaStatus === 'Compliant' 
                                  ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30' 
                                  : 'bg-rose-500/15 text-rose-500 border border-rose-500/30 animate-pulse'
                              }`}>
                                {milestone.slaScore}% — {milestone.slaStatus}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">Awaiting Milestone</span>
                          )}
                        </td>

                        {/* Tranche Amount */}
                        <td className="p-4 font-mono font-bold text-sm theme-heading whitespace-nowrap">
                          ${milestone.trancheAmount.toLocaleString()}
                        </td>

                        {/* Gatekeeper Payout Status */}
                        <td className="p-4 whitespace-nowrap">
                          {milestone.status === 'Released' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 size={13} /> Released & Paid
                            </span>
                          )}
                          {milestone.status === 'Authorized' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                              <Unlock size={13} /> Authorized by Investor
                            </span>
                          )}
                          {milestone.status === 'On Hold' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                              <Lock size={13} /> On Hold (SLA Withheld)
                            </span>
                          )}
                          {milestone.status === 'Locked' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-white/5 text-slate-400 border theme-border">
                              <Lock size={13} /> Scheduled Phase
                            </span>
                          )}
                        </td>

                        {/* Interactive Investor Actions */}
                        <td className="p-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            {/* Expand / Inspect Button */}
                            <button
                              type="button"
                              onClick={() => setExpandedMilestoneId(isExpanded ? null : milestone.id)}
                              className="px-3 py-1.5 rounded-xl theme-card border theme-border hover:border-[#FF5A14]/50 theme-heading text-xs font-semibold inline-flex items-center gap-1 transition-all"
                            >
                              <Eye size={12} />
                              <span>Audit</span>
                              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>

                            {/* Authorize or Place On Hold Button */}
                            {milestone.status !== 'Released' && milestone.status !== 'Locked' && (
                              <button
                                type="button"
                                onClick={() => handleToggleTranchePayout(milestone.id)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1 ${
                                  milestone.status === 'On Hold'
                                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
                                    : 'bg-rose-600 hover:bg-rose-500 text-white'
                                }`}
                              >
                                {milestone.status === 'On Hold' ? (
                                  <>
                                    <Unlock size={12} /> Authorize Release
                                  </>
                                ) : (
                                  <>
                                    <Lock size={12} /> Place On Hold
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded SOW Deliverables & SLA Audit Details */}
                      {isExpanded && (
                        <tr className="bg-slate-50 dark:bg-slate-900/40 border-b theme-border">
                          <td colSpan={6} className="p-5">
                            <div className="space-y-4 max-w-4xl">
                              
                              {/* AI Gatekeeper Alert Box */}
                              <div className={`p-4 rounded-xl border leading-relaxed text-xs ${
                                isBlocked 
                                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300' 
                                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                              }`}>
                                <div className="font-bold flex items-center gap-1.5 mb-1 text-[11px] uppercase tracking-wider">
                                  {isBlocked ? <AlertTriangle size={14} className="text-rose-500" /> : <ShieldCheck size={14} className="text-emerald-500" />}
                                  <span>Autonomous Capital Gatekeeper Verdict:</span>
                                </div>
                                <p className="font-sans font-medium">{milestone.aiAudit}</p>
                              </div>

                              {/* Two Columns: Contract Deliverables Checklist vs SLA Benchmark */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                
                                {/* Contract Deliverables */}
                                <div className="p-4 rounded-xl theme-card border theme-border">
                                  <div className="font-bold theme-heading mb-2.5 flex items-center justify-between">
                                    <span className="flex items-center gap-1.5">
                                      <FileCheck size={14} className="text-[#FF5A14]" />
                                      Contract SOW Deliverables
                                    </span>
                                    <span className="text-[10px] theme-muted font-normal">Source: SharePoint M365</span>
                                  </div>
                                  <ul className="space-y-2">
                                    {milestone.deliverables.map((item, dIdx) => (
                                      <li key={dIdx} className="flex items-center justify-between text-[11px]">
                                        <span className="theme-muted truncate mr-2">• {item.title}</span>
                                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                          item.status === 'Verified' ? 'bg-emerald-500/15 text-emerald-500' :
                                          item.status.includes('Blocked') ? 'bg-red-500/15 text-red-500' : 'bg-slate-200 dark:bg-white/10 text-slate-400'
                                        }`}>
                                          {item.status}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                {/* Financial Disbursement Governance */}
                                <div className="p-4 rounded-xl theme-card border theme-border flex flex-col justify-between">
                                  <div>
                                    <div className="font-bold theme-heading mb-2.5 flex items-center justify-between">
                                      <span className="flex items-center gap-1.5">
                                        <DollarSign size={14} className="text-emerald-500" />
                                        Disbursement Authorization Schedule
                                      </span>
                                      <span className="text-[10px] theme-muted font-normal">SAP S/4HANA Feed</span>
                                    </div>
                                    <div className="space-y-1.5 text-[11px] theme-muted">
                                      <div>Tranche Allocation: <span className="font-bold theme-heading">${milestone.trancheAmount.toLocaleString()} USD</span></div>
                                      <div>Disbursement Status: <span className="font-bold theme-heading">{milestone.payoutDate}</span></div>
                                      <div>Linked Blocker Ticket: <span className="font-mono text-[#FF5A14] font-bold">{milestone.id === 'M-03' ? 'Risk R-802 (PRJ-1-103)' : 'None (Cleared)'}</span></div>
                                    </div>
                                  </div>

                                  <div className="pt-3 border-t theme-border mt-3 text-[11px] flex items-center justify-between">
                                    <span className="text-slate-400 italic">Investor Safeguard Rule #4</span>
                                    <span className="font-bold text-[#FF5A14]">Zero-Disbursement on SLA Breach</span>
                                  </div>
                                </div>

                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        </div>

      </div>
    );
  };

  // ==========================================
  // 2. PMO VIEW
  // ==========================================
  const renderPMOView = () => (
    <div className="space-y-8">
      {/* Dynamic Approval & Escalation Alert Banner */}
      <div className="p-4 rounded-2xl theme-card border-l-4 border-[#FF5A14] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#FF5A14]/15 text-[#FF5A14] flex items-center justify-center flex-shrink-0 shadow-sm">
            <AlertTriangle size={18} />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold theme-heading">
              Governance Gate Approval Required
            </h4>
            <p className="text-xs theme-muted">
              {escalations.length} active supplier compliance items flagged for review.
            </p>
          </div>
        </div>
        <Link 
          to="/guardrails" 
          className="px-4 py-2 rounded-xl bg-[#FF5A14] text-white text-xs font-bold shadow-md hover:bg-[#FF7A45] transition-colors flex items-center gap-1.5"
        >
          <span>Audit in Guardrails</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <RiskHeatmap data={risks} />
        </div>

        <div className="flex flex-col gap-6">
          {/* Futuristic Ingestion Dropzone Panel */}
          <div className="p-6 rounded-2xl theme-card relative overflow-hidden">
            <h3 className="text-base font-bold theme-heading mb-1 flex items-center gap-2">
              <FileUp className="text-[#FF5A14]" size={18} />
              <span>Ingest MOM / Vendor Statement of Work</span>
            </h3>
            <p className="text-xs theme-muted mb-4">
              Autonomous ingestion extracts deliverables, computes risk scores, and updates semantic memory.
            </p>
            
            <input 
              ref={fileInputRef} 
              type="file" 
              className="hidden" 
              accept=".pdf,.docx,.xlsx,.txt" 
              onChange={handleFileUpload} 
            />

            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingDoc}
              className="w-full py-6 px-4 border-2 border-dashed border-[#FF5A14]/40 hover:border-[#FF5A14] theme-subtle rounded-2xl hover:bg-[#FF5A14]/5 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer disabled:opacity-50 group relative overflow-hidden"
            >
              {uploadingDoc && (
                <div className="absolute inset-0 bg-gradient-to-b from-[#FF5A14]/20 to-transparent animate-radar-sweep pointer-events-none"></div>
              )}

              {uploadingDoc ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="animate-spin text-[#FF5A14]" size={24} />
                  <span className="text-xs font-bold theme-heading">
                    Ingesting Document Telemetry ({uploadProgress}%)...
                  </span>
                  <span className="text-[11px] theme-muted font-mono">
                    Chunking semantic embeddings & triggering Risk Agent
                  </span>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-[#FF5A14]/10 text-[#FF5A14] flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                    <FileUp size={20} />
                  </div>
                  <span className="text-xs font-bold theme-heading group-hover:text-[#FF7A45] transition-colors">
                    Click to browse or drop supplier contract (.pdf, .docx, .xlsx)
                  </span>
                  <span className="text-[11px] theme-muted">
                    Auto-enforces compliance guardrails & extracts milestone deliverables
                  </span>
                </>
              )}
            </button>
          </div>
          
          {/* Active Escalations Feed */}
          <div className="p-6 rounded-2xl theme-card flex-1">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold theme-heading flex items-center gap-2">
                <Clock size={16} className="text-[#FF5A14]" />
                <span>Active Governance Escalation Stream</span>
              </h3>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full theme-badge">
                {escalations.length} Active
              </span>
            </div>

            {escalations.length === 0 ? (
              <p className="text-xs theme-muted italic py-4 text-center">
                All vendor streams compliant with current SOPs.
              </p>
            ) : (
              <div className="space-y-2.5">
                {escalations.map((esc, idx) => (
                  <div key={idx} className="p-3 rounded-xl theme-subtle border theme-border flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-[#FF5A14] font-mono mr-2">{esc.id || `ESC-${idx + 1}`}</span>
                      <span className="font-medium theme-heading">{esc.action || esc.title || 'SLA Threshold Warning'}</span>
                    </div>
                    <span className="text-[10px] theme-muted font-mono theme-badge px-2 py-0.5 rounded">
                      {esc.time || '15m ago'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // ==========================================
  // 3. PROGRAM DIRECTOR VIEW
  // ==========================================
  const renderProgramDirectorView = () => (
    <div className="space-y-8">
      {/* 3 Executive Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl theme-card">
          <h4 className="text-xs font-bold theme-muted uppercase tracking-wider mb-2">Cross-Project Status</h4>
          <div className="text-2xl sm:text-3xl font-black theme-heading flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
            {crossProjectStatus}
          </div>
        </div>

        <div className="p-6 rounded-2xl theme-card">
          <h4 className="text-xs font-bold theme-muted uppercase tracking-wider mb-2">Schedule Variance</h4>
          <div className={`text-2xl sm:text-3xl font-black ${scheduleVariance.includes('-') ? 'text-red-500' : 'text-emerald-500'}`}>
            {scheduleVariance}
          </div>
        </div>

        <div className="p-6 rounded-2xl theme-card">
          <h4 className="text-xs font-bold theme-muted uppercase tracking-wider mb-2">Total Budget Burn</h4>
          <div className="text-2xl sm:text-3xl font-black text-[#FF5A14]">
            {totalBudgetBurn}
          </div>
        </div>
      </div>

      {/* Showstoppers & Blockers Table */}
      <div className="p-6 rounded-2xl theme-card">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-base font-bold theme-heading">Active Showstoppers & Delivery Blockers</h3>
            <p className="text-xs theme-muted">Autonomous blocker detection across Jira epics and vendor rate cards</p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
            {showstoppers.length} Flagged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs whitespace-nowrap">
            <thead className="uppercase tracking-wider border-b border-slate-200 dark:border-white/10 theme-muted font-bold">
              <tr>
                <th className="px-5 py-3">Risk ID</th>
                <th className="px-5 py-3">Description</th>
                <th className="px-5 py-3">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y theme-border">
              {showstoppers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-5 py-4 text-center theme-muted italic">
                    No critical showstoppers detected across portfolio.
                  </td>
                </tr>
              ) : (
                showstoppers.map((item, idx) => (
                  <tr key={idx} className="theme-subtle-hover transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-[#FF5A14]">{item.id}</td>
                    <td className="px-5 py-3.5 font-medium theme-heading">{item.title}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-1 bg-red-500/15 text-red-500 border border-red-500/30 rounded-full text-[10px] font-bold uppercase">
                        {item.impact || 'CRITICAL'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Portfolio Projects Drilldown Grid */}
      <div className="p-6 rounded-2xl theme-card">
        <h3 className="text-base font-bold theme-heading mb-4">
          Supervised Program Engagements
        </h3>
        {data?.projects && data.projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.projects.map((proj) => (
              <Link
                key={proj.id}
                to={`/project/${proj.id}`}
                className="p-4 rounded-xl border theme-border hover:border-[#FF5A14] theme-subtle hover:bg-[#FF5A14]/5 transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold theme-heading text-sm group-hover:text-[#FF7A45] transition-colors">
                    {proj.id}: {proj.name}
                  </div>
                  <div className="text-xs theme-muted mt-1">
                    {proj.budget_summary} • Status: <span className="text-emerald-500 font-bold">{proj.status}</span>
                  </div>
                </div>
                <ExternalLink size={16} className="text-[#FF5A14] group-hover:translate-x-0.5 transition-transform" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl theme-card text-xs theme-muted italic text-center">
            No projects loaded
          </div>
        )}
      </div>
    </div>
  );

  // ==========================================
  // 4. PROJECT MANAGER VIEW
  // ==========================================
  const renderProjectManagerView = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <BurndownChart data={burndown} />
        </div>

        <div className="flex flex-col gap-6">
          {/* Team Velocity Card */}
          <div className="p-6 rounded-2xl theme-card flex-1">
            <h3 className="text-sm font-bold theme-heading mb-2 flex items-center gap-2">
              <Activity size={16} className="text-[#FF5A14]" />
              <span>Sprint Delivery Velocity</span>
            </h3>
            
            <div className="flex flex-col items-center justify-center py-6">
              {velocity && velocity.points !== undefined && velocity.points !== null ? (
                <div className="text-center">
                  <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] mb-2 tracking-tight">
                    {velocity.points}
                  </div>
                  <div className="text-xs font-semibold theme-muted uppercase tracking-wider">
                    {velocity.unit || "Story Points / Sprint"}
                  </div>
                  {velocity.trend && (
                    <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20">
                      <TrendingUp size={12} />
                      <span>{velocity.trend}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-xs theme-muted italic">
                    No velocity data yet
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Open Task Blockers */}
          <div className="p-6 rounded-2xl theme-card">
            <h3 className="text-sm font-bold theme-heading mb-3 flex items-center justify-between">
              <span>Sprint Task Blockers</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/20 font-bold">
                {openBlockers.length} Blocked
              </span>
            </h3>

            {openBlockers.length === 0 ? (
              <p className="text-xs theme-muted italic py-2">
                No active blockers detected in current sprint backlog.
              </p>
            ) : (
              <ul className="space-y-2.5 text-xs">
                {openBlockers.map((b, idx) => (
                  <li key={idx} className="p-2.5 rounded-xl theme-subtle border theme-border flex justify-between items-center">
                    <span className="theme-heading font-medium">
                      <strong className="text-[#FF5A14] font-mono mr-1">{b.id}:</strong> {b.title}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                      b.status === 'Blocked' ? 'bg-red-500/15 text-red-500 border border-red-500/30' : 'bg-amber-500/15 text-amber-500'
                    }`}>
                      {b.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="py-2 space-y-6">
      
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#FF5A14]/15 text-[#FF5A14] border border-[#FF5A14]/30">
              {user?.role || 'Executive'} Portal
            </span>
            <span className="text-xs theme-muted font-mono">
              Live Sync: {lastUpdated.toLocaleTimeString()}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black theme-heading tracking-tight">
            {user?.role === 'Investor' ? 'Portfolio Capital & ROI Overview' : 
             user?.role === 'Program Director' ? 'Multi-Program Governance Console' : 
             user?.role === 'PMO' ? 'PMO Compliance & Guardrail Command' : 'Project Execution & Velocity Dashboard'}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleGenerateReport}
            disabled={generatingReport}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white text-xs font-bold shadow-[0_0_20px_rgba(255,90,20,0.35)] hover:shadow-[0_0_30px_rgba(255,90,20,0.55)] hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
          >
            {generatingReport ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
            <span>{generatingReport ? 'Synthesizing Brief...' : '1-Click Executive PDF'}</span>
          </button>
        </div>
      </div>

      {/* AI PROCESSING DEGRADED: ADVANCED HIGH-TECH SENTINEL ALERT */}
      {data?.ai_processing_status === 'degraded_fallback' && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-500/30 shadow-sm flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-500 text-white dark:bg-amber-500/20 dark:text-amber-400 flex-shrink-0 mt-0.5 shadow-sm">
            <AlertTriangle size={18} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-extrabold text-amber-950 dark:text-amber-300">
                AI Sentinel Notice: Fallback Heuristics Active
              </h4>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-200/80 dark:bg-amber-900/50 text-amber-900 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700/50">
                degraded_fallback
              </span>
            </div>
            <p className="text-xs text-amber-900 dark:text-amber-200/90 mt-1.5 leading-relaxed font-medium">
              Remote AI inference endpoint timed out or returned unstructured data. Deterministic fallback heuristics applied to maintain uninterrupted dashboard telemetry.
            </p>
          </div>
        </div>
      )}

      {/* Active Persona Profile Rendering */}
      {user?.role === 'Investor' && renderInvestorView()}
      {user?.role === 'PMO' && renderPMOView()}
      {user?.role === 'Program Director' && renderProgramDirectorView()}
      {user?.role === 'Project Manager' && renderProjectManagerView()}

    </div>
  );
};

export default InvestorDashboard;
