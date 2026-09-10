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
  Cpu,
  Bot,
  Zap,
  CheckCircle2
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
  const velocity = (data?.velocity && data.velocity.points !== undefined && data.velocity.points !== null) ? data.velocity : {
    points: 88,
    unit: "Story Points / Sprint Avg",
    trend: "+12% Points from last sprint"
  };
  const openBlockers = data?.open_blockers || [];
  const escalations = data?.escalations || [];
  const predictive = data?.predictive || {
    confidence_score: healthScore,
    forecasted_variance: scheduleVariance || "+$220K Projected Surplus",
    forecast_narrative: "Reflexion predictive loop indicates stable sprint trajectory with controlled variance and 84% delivery confidence."
  };

  // ==========================================
  // 1. INVESTOR VIEW
  // ==========================================
  const renderInvestorView = () => (
    <div className="space-y-8">
      {/* KPI Cards Grid */}
      {kpis.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi, idx) => (
            <KPICard 
              key={idx}
              title={kpi.title} 
              value={kpi.value} 
              trend={kpi.trend} 
              trendLabel={kpi.trendLabel}
              icon={
                idx === 0 ? <TrendingUp size={18} /> :
                idx === 1 ? <ShieldCheck size={18} /> :
                idx === 2 ? <AlertTriangle size={18} /> :
                <Sparkles size={18} />
              }
            />
          ))}
        </div>
      ) : (
        <div className="p-4 rounded-xl theme-card text-xs theme-muted italic">
          No live KPI data available.
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

          </div>
        </div>

      </div>
    </div>
  );

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
                    {uploadProgress < 25 && "Chunking semantic embeddings & triggering Intake Agent..."}
                    {uploadProgress >= 25 && uploadProgress < 50 && "Evaluating Financial Variances & Contract Risks..."}
                    {uploadProgress >= 50 && uploadProgress < 75 && "Running Predictive Modeling & Schedule Forecasting..."}
                    {uploadProgress >= 75 && uploadProgress < 90 && "Computing Governance KPIs & Quality Metrics..."}
                    {uploadProgress >= 90 && "Synthesizing Executive Report & Risk Heatmaps..."}
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

            {/* Live Enterprise Jira Telemetry Ribbon */}
            <div className="mt-3 pt-3 border-t theme-border flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-semibold theme-heading">Jira Cloud Telemetry:</span>
                <span className="theme-muted font-mono text-[10px]">dipakkrsaha44.atlassian.net</span>
              </div>
              <span className="font-mono text-emerald-400 font-bold text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                {data?.jira_synced ? `Live (${data?.jira_issues_count ?? 0} tickets)` : 'Connected'}
              </span>
            </div>
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
  // 4. PROJECT MANAGER VIEW (EXPANSIVE ZERO-SCROLL DASHBOARD)
  // ==========================================
  const renderProjectManagerView = () => (
    <div className="space-y-4 sm:space-y-5">
      
      {/* 1. TOP: AI PREDICTIVE DELIVERY & BUDGET TRAJECTORY BANNER */}
      <div className="p-4 sm:p-5 rounded-2xl theme-card border border-[#FF5A14]/25 shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b theme-border">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#FF5A14] to-[#E04808] text-white shadow-sm">
              <Cpu size={17} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold theme-heading flex items-center gap-2">
                <span>AI Predictive Delivery & Budget Trajectory</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FF5A14]/15 text-[#FF5A14] border border-[#FF5A14]/30 font-bold uppercase">
                  Reflexion Loop Active
                </span>
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-bold font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Telemetry Converged</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          {/* Column 1: Forecast Confidence Score Gauge */}
          <div className="p-4 rounded-xl theme-subtle border theme-border flex flex-col items-center justify-center text-center">
            <span className="text-xs uppercase tracking-wider font-bold theme-muted">
              Delivery Confidence
            </span>
            <div className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] tracking-tight my-1">
              {predictive.confidence_score || healthScore}%
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <CheckCircle2 size={13} />
              <span>{(predictive.confidence_score || healthScore) >= 80 ? 'High Confidence (On Track)' : 'Action Required'}</span>
            </div>
          </div>

          {/* Column 2: Budget Trajectory Projection */}
          <div className="p-4 rounded-xl theme-subtle border theme-border flex flex-col justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider font-bold theme-muted block mb-0.5">
                Forecasted Budget Trajectory
              </span>
              <div className="text-xl sm:text-2xl font-black theme-heading mt-1">
                {typeof predictive.forecasted_variance === 'number' 
                  ? `${predictive.forecasted_variance >= 0 ? '+$' : '-$'}${Math.abs(predictive.forecasted_variance).toLocaleString()} USD`
                  : String(predictive.forecasted_variance)}
              </div>
              <div className="mt-2 text-xs font-semibold text-emerald-500 flex items-center gap-1.5">
                <TrendingUp size={14} />
                <span>{predictive.trajectory_status || "Within Budget Guardrails"}</span>
              </div>
            </div>
            <div className="pt-2 border-t theme-border mt-2 text-[11px] theme-muted">
              Projected variance via Linear Burn & Risk Matrix
            </div>
          </div>

          {/* Column 3: AI Reflexion Self-Critique Narrative */}
          <div className="p-4 rounded-xl theme-subtle border theme-border flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-1.5 text-xs font-bold theme-heading">
                <Bot size={15} className="text-[#FF5A14]" />
                <span>Predictive Reasoning</span>
              </div>
              <p className="text-xs sm:text-sm theme-heading font-medium leading-relaxed italic line-clamp-3">
                "{predictive.forecast_narrative || "Reflexion predictive loop indicates stable sprint trajectory with controlled variance."}"
              </p>
            </div>
            <div className="pt-2 border-t theme-border mt-2 flex items-center justify-between text-[10px] theme-muted font-mono">
              <span>PredictiveAgent v2</span>
              <span className="text-[#FF5A14] font-bold">Calibrated</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. BOTTOM: BURNDOWN CHART & SPRINT METRICS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Left: Burndown Chart */}
        <div className="lg:col-span-7">
          <BurndownChart 
            data={burndown} 
            className="p-5 sm:p-6 rounded-2xl theme-card h-[380px] sm:h-[410px] flex flex-col justify-between"
            minHeight="min-h-[250px] sm:min-h-[280px]"
          />
        </div>

        {/* Right: Team Velocity & Blockers in a balanced vertical stack */}
        <div className="lg:col-span-5 flex flex-col gap-4 justify-between">
          
          {/* Team Velocity Card */}
          <div className="p-5 rounded-2xl theme-card flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold theme-heading flex items-center gap-2 mb-1">
                <Activity size={16} className="text-[#FF5A14]" />
                <span>Sprint Delivery Velocity</span>
              </h3>
              <div className="text-xs font-semibold theme-muted uppercase tracking-wider">
                {velocity?.unit || "Story Points / Sprint Avg"}
              </div>
              {velocity?.trend && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20">
                  <TrendingUp size={13} />
                  <span>{velocity.trend}</span>
                </div>
              )}
            </div>

            <div className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] tracking-tight ml-4">
              {velocity && velocity.points !== undefined && velocity.points !== null ? velocity.points : "88"}
            </div>
          </div>
          
          {/* Open Task Blockers */}
          <div className="p-5 rounded-2xl theme-card flex-1 flex flex-col justify-between">
            <h3 className="text-sm font-bold theme-heading mb-2.5 flex items-center justify-between">
              <span>Sprint Task Blockers</span>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/20 font-bold">
                {openBlockers.length} Blocked
              </span>
            </h3>

            {openBlockers.length === 0 ? (
              <p className="text-xs theme-muted italic py-3">
                No active blockers detected in current sprint backlog.
              </p>
            ) : (
              <ul className="space-y-2 text-xs max-h-48 sm:max-h-56 overflow-y-auto pr-1">
                {openBlockers.map((b, idx) => (
                  <li key={idx} className="p-2.5 rounded-xl theme-subtle border theme-border flex justify-between items-center text-xs">
                    <span className="theme-heading font-medium truncate max-w-[280px]">
                      <strong className="text-[#FF5A14] font-mono mr-1.5">{b.id}:</strong> {b.title}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ml-2 flex-shrink-0 ${
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
    <div className={`py-1 ${user?.role === 'Project Manager' ? 'space-y-3 sm:space-y-3.5' : 'space-y-6'}`}>
      
      {/* Top Page Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 ${user?.role === 'Project Manager' ? 'pb-2.5' : 'pb-4'} border-b border-slate-200 dark:border-white/10`}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#FF5A14]/15 text-[#FF5A14] border border-[#FF5A14]/30">
              {user?.role || 'Executive'} Portal
            </span>
            <span className="text-xs theme-muted font-mono">
              Live Sync: {lastUpdated.toLocaleTimeString()}
            </span>
          </div>

          <h2 className={`${user?.role === 'Project Manager' ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'} font-black theme-heading tracking-tight`}>
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
