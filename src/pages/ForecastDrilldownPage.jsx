import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { useToast } from '../context/ToastContext';
import { dashboardApi } from '../api/dashboardApi';
import { risksApi } from '../api/risksApi';
import FuturisticLoader from '../components/common/FuturisticLoader';
import {
  ArrowLeft,
  Brain,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Target,
  RefreshCw,
  ShieldAlert,
  AlertTriangle,
  DollarSign,
  Layers,
  ChevronRight,
  CheckCircle2,
  Cpu,
  BarChart3,
  Calendar,
  Activity,
  ExternalLink,
  Zap,
  Clock,
  Briefcase,
  Lightbulb,
  Plus,
  Check,
  Compass,
  ShieldCheck,
  Flame
} from 'lucide-react';

const ForecastDrilldownPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { activeProject, projects, selectProject } = useProject();

  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastExecuted, setLastExecuted] = useState(new Date());
  const [isCached, setIsCached] = useState(false);
  const [adoptingThreatId, setAdoptingThreatId] = useState(null);
  const [adoptedThreats, setAdoptedThreats] = useState(new Set());
  const [selectedThreatModal, setSelectedThreatModal] = useState(null);

  // Determine current active project ID
  const currentProjectId = id || activeProject?.numeric_id || activeProject?.id || '1';

  // Find project details if available
  const matchedProject = projects?.find(
    p => String(p.id) === String(currentProjectId) || String(p.numeric_id) === String(currentProjectId) || p.jira_key === currentProjectId
  ) || activeProject;

  const runPredictiveForecast = useCallback(async (isRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      const res = await dashboardApi.getForecast(currentProjectId, isRefresh);
      if (res && res.status === 'success') {
        setForecastData(res.data);
        setIsCached(res.source === 'database_cached');
        setLastExecuted(res.data?.updated_at ? new Date(res.data.updated_at) : new Date());
      } else {
        setError(res?.message || 'Predictive forecasting failed to converge.');
      }
    } catch (err) {
      console.error('Failed to run forecast:', err);
      setError(err?.response?.data?.message || err?.message || 'Unable to generate predictive forecast.');
    } finally {
      setLoading(false);
    }
  }, [currentProjectId]);

  useEffect(() => {
    runPredictiveForecast(false);
  }, [runPredictiveForecast]);

  const fmtMoney = (val) => {
    if (val === undefined || val === null) return '$0';
    const num = Number(val);
    const abs = Math.abs(num);
    const sign = num < 0 ? '-' : '';
    if (abs >= 1000000) return `${sign}$${(abs / 1000000).toFixed(1)}M`;
    if (abs >= 1000) return `${sign}$${Math.round(abs / 1000)}K`;
    return `${sign}$${Math.round(abs).toLocaleString()}`;
  };

  const fmtCurrency = fmtMoney;

  const fmtVariance = (val) => {
    if (val === undefined || val === null) return '$0';
    const num = Number(val);
    const abs = Math.abs(num);
    const sign = num < 0 ? '-' : num > 0 ? '+' : '';
    if (abs >= 1000000) return `${sign}$${(abs / 1000000).toFixed(1)}M`;
    if (abs >= 1000) return `${sign}$${Math.round(abs / 1000)}K`;
    return `${sign}$${Math.round(abs).toLocaleString()}`;
  };

  const forecastedVariance = forecastData?.forecasted_variance ?? 0;
  const confidenceScore = forecastData?.confidence_score ?? 85;
  const plannedSpend = forecastData?.total_planned ?? 0;
  const actualSpend = forecastData?.total_actual ?? 0;
  const currentVariance = forecastData?.current_variance ?? 0;
  const narrative = forecastData?.forecasted_narrative || forecastData?.forecast_narrative || 
    'Trajectory converged through Reflexion critique against risk register and current burn acceleration.';
  const evaluatedRisks = forecastData?.evaluated_risks || [];

  const rawProjectedRisks = forecastData?.projected_risks;
  const projectedRisks = Array.isArray(rawProjectedRisks) ? rawProjectedRisks : [];

  const handleAdoptThreat = async (threat, idx) => {
    try {
      setAdoptingThreatId(idx);
      const randomRiskNum = Math.floor(100 + Math.random() * 900);
      await risksApi.createRisk({
        project_id: currentProjectId,
        risk_id: `R-AI-${randomRiskNum}`,
        title: threat.threat_title,
        description: `[AI Projected Threat] ${threat.threat_title}. Category: ${threat.category}. Probability: ${threat.probability_pct}%. Estimated Exposure: $${Math.round(Number(threat.financial_exposure || 0)).toLocaleString()}`,
        severity: threat.severity || 'High',
        status: 'Open',
        owner: user?.name || 'Predictive Agent',
        mitigation_plan: threat.preventive_action || 'Review mitigation strategy in SteerCo.'
      });
      setAdoptedThreats(prev => new Set([...prev, idx]));
      showToast(`Added '${threat.threat_title}' to project Risk Register!`, 'success');
    } catch (err) {
      console.error('Failed to add risk to register:', err);
      showToast('Could not register risk. Please try again.', 'error');
    } finally {
      setAdoptingThreatId(null);
    }
  };

  const getTrajectoryInfo = (variance) => {
    if (variance < 0) {
      return {
        label: 'Over Budget Deficit',
        badgeColor: 'bg-red-500/15 text-red-400 border-red-500/30',
        textColor: 'text-red-400',
        icon: <TrendingDown size={18} className="text-red-400" />
      };
    }
    if (variance > 0) {
      return {
        label: 'Under Budget Surplus',
        badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        textColor: 'text-emerald-400',
        icon: <TrendingUp size={18} className="text-emerald-400" />
      };
    }
    return {
      label: 'On Planned Target',
      badgeColor: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
      textColor: 'text-cyan-400',
      icon: <Target size={18} className="text-cyan-400" />
    };
  };

  const trajectory = getTrajectoryInfo(forecastedVariance);

  // DEFAULT PROJECT LOADER (MATCHES INVESTORDASHBOARD, PROJECTDRILLDOWN, ETC.)
  if (loading) {
    return (
      <FuturisticLoader 
        title="Synthesizing Predictive Forecast Intelligence..." 
        subtitle={`Calibrating Reflexion convergence loop across live burn velocity & threat matrix for ${matchedProject?.name || `Project #${currentProjectId}`}`}
      />
    );
  }

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-300">
      
      {/* 1. TOP BREADCRUMB & DRILLDOWN HERO HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-5 rounded-2xl theme-card border border-white/10 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-violet-600/10 via-[#FF5A14]/10 to-transparent blur-3xl pointer-events-none" />

        <div className="space-y-2 relative z-10">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs theme-muted flex-wrap">
            <button
              onClick={() => navigate('/dashboard')}
              className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft size={13} />
              <span>Command Center</span>
            </button>
            <ChevronRight size={12} className="opacity-40" />
            <button
              onClick={() => navigate(`/project/${currentProjectId}`)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              {matchedProject?.name || `Project #${currentProjectId}`}
            </button>
            <ChevronRight size={12} className="opacity-40" />
            <span className="text-violet-400 font-semibold flex items-center gap-1">
              <Sparkles size={12} />
              <span>Level 4 Drilldown: AI Predictive Forecast</span>
            </span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/25">
              <Brain size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black theme-heading tracking-tight flex items-center gap-2">
                <span>AI Predictive Cost & Risk Forecast</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-violet-500/15 text-violet-400 border border-violet-500/30">
                  {isCached ? 'SAVED TELEMETRY (INSTANT)' : 'REFLEXION AI CONVERGED'}
                </span>
              </h1>
              <p className="text-xs theme-muted">
                Multi-agent predictive self-critique loop • Converged cost variance projection for {matchedProject?.name || `Project #${currentProjectId}`}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2.5 rounded-xl theme-subtle hover:bg-white/10 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back to Dashboard</span>
          </button>

          <button
            onClick={() => runPredictiveForecast(true)}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] hover:from-[#e04f10] hover:to-[#ff6830] text-white text-xs font-bold shadow-[0_0_20px_rgba(255,90,20,0.35)] hover:shadow-[0_0_30px_rgba(255,90,20,0.55)] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Analyzing...' : 'Re-Run Predictive Analysis'}</span>
          </button>
        </div>
      </div>



      {/* 3. ERROR STATE */}
      {error && !loading && (
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-center space-y-3">
          <AlertTriangle size={32} className="mx-auto text-red-400" />
          <h3 className="text-sm font-bold text-red-400">Forecast Execution Failed</h3>
          <p className="text-xs theme-muted max-w-md mx-auto">{error}</p>
          <button
            onClick={runPredictiveForecast}
            className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-bold transition-all cursor-pointer"
          >
            Retry Generation
          </button>
        </div>
      )}

      {/* 4. MAIN FORECAST DRILLDOWN CONTENT */}
      {forecastData && (
        <div className="space-y-6">

          {/* KEY METRICS 4-COLUMN CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* CARD 1: CONVERGED COST VARIANCE */}
            <div className="p-5 rounded-2xl theme-card border border-white/10 hover:border-violet-500/40 transition-all flex flex-col justify-between group">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider font-bold theme-muted">Forecasted Variance</span>
                <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center text-violet-400">
                  <DollarSign size={16} />
                </div>
              </div>
              <div className="mt-3">
                <div className={`text-2xl font-black ${trajectory.textColor}`}>
                  {fmtVariance(forecastedVariance)}
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${trajectory.badgeColor} flex items-center gap-1`}>
                    {trajectory.icon}
                    {trajectory.label}
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t theme-border text-[11px] theme-muted flex justify-between">
                <span>Linear Burn Baseline:</span>
                <span className="font-mono text-white/90">
                  {currentVariance < 0 ? `-${fmtMoney(Math.abs(currentVariance))} Deficit` : `+${fmtMoney(currentVariance)} Surplus`}
                </span>
              </div>
            </div>

            {/* CARD 2: CONFIDENCE SCORE */}
            <div className="p-5 rounded-2xl theme-card border border-white/10 hover:border-cyan-500/40 transition-all flex flex-col justify-between group">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider font-bold theme-muted">Reflexion Confidence</span>
                <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center text-cyan-400">
                  <Target size={16} />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-cyan-400 flex items-baseline gap-1">
                  <span>{confidenceScore}%</span>
                  <span className="text-xs theme-muted font-normal">Score</span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden mt-3">
                  <div 
                    className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(100, Math.max(0, confidenceScore))}%` }}
                  />
                </div>
              </div>
              <div className="mt-3 pt-3 border-t theme-border text-[11px] theme-muted flex justify-between">
                <span>Convergence Loop:</span>
                <span className="font-mono text-emerald-400">Converged & Stabilized</span>
              </div>
            </div>

            {/* CARD 3: PLANNED VS ACTUAL SPEND */}
            <div className="p-5 rounded-2xl theme-card border border-white/10 hover:border-[#FF5A14]/40 transition-all flex flex-col justify-between group">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider font-bold theme-muted">Capital Spend Baseline</span>
                <div className="w-8 h-8 rounded-lg bg-[#FF5A14]/15 flex items-center justify-center text-[#FF5A14]">
                  <BarChart3 size={16} />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-xl sm:text-2xl font-black theme-heading">
                  {fmtMoney(actualSpend)} / {fmtMoney(plannedSpend)}
                </div>
                <div className="text-xs theme-muted mt-1">
                  {plannedSpend > 0 ? `${Math.round((actualSpend / plannedSpend) * 100)}% Burned` : 'N/A'} • Approved Baseline: {fmtMoney(plannedSpend)}
                </div>
              </div>
              <div className="mt-3 pt-3 border-t theme-border text-[11px] theme-muted flex justify-between">
                <span>Capital Status:</span>
                <span className={`font-semibold ${currentVariance < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {currentVariance < 0 ? 'Budget Deficit' : 'Within Budget'}
                </span>
              </div>
            </div>

            {/* CARD 4: CRITICAL THREAT MATRIX */}
            <div className="p-5 rounded-2xl theme-card border border-white/10 hover:border-amber-500/40 transition-all flex flex-col justify-between group">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider font-bold theme-muted">Active High/Crit Risks</span>
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400">
                  <ShieldAlert size={16} />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-amber-400 flex items-baseline gap-1">
                  <span>{forecastData?.risk_count ?? evaluatedRisks.length}</span>
                  <span className="text-xs theme-muted font-normal">Active Threats</span>
                </div>
                <div className="text-xs theme-muted mt-1">
                  Evaluated in Phase 2 Self-Critique
                </div>
              </div>
              <div className="mt-3 pt-3 border-t theme-border text-[11px] theme-muted flex justify-between items-center">
                <span>Threat Status:</span>
                <Link to="/risks" className="text-amber-400 hover:underline flex items-center gap-1 font-semibold">
                  Open Register <ExternalLink size={10} />
                </Link>
              </div>
            </div>

          </div>

          {/* 5. REFLEXION PREDICTIVE LOOP 3-PHASE CONVERGENCE PIPELINE */}
          <div className="p-6 rounded-2xl theme-card border border-white/10 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <Cpu size={18} className="text-violet-400" />
                <h3 className="text-sm font-black theme-heading uppercase tracking-wider">
                  Reflexion Multi-Phase Predictive Convergence Architecture
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/30">
                Self-Critique Engine
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Phase 1 */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 relative">
                <div className="flex items-center justify-between text-xs font-bold text-cyan-400">
                  <span className="flex items-center gap-1.5">
                    <Activity size={14} />
                    Phase 1: Initial Projection
                  </span>
                  <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded">
                    Linear Burn
                  </span>
                </div>
                <p className="text-xs theme-muted leading-relaxed">
                  Formulates baseline financial variance from active budget burn rates and milestone delivery cadence.
                </p>
                <div className="text-xs font-mono font-bold text-white/90 pt-1">
                  Baseline Variance: {currentVariance < 0 ? `-${fmtMoney(Math.abs(currentVariance))}` : `+${fmtMoney(currentVariance)}`}
                </div>
              </div>

              {/* Phase 2 */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 relative">
                <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                  <span className="flex items-center gap-1.5">
                    <ShieldAlert size={14} />
                    Phase 2: Self-Critique
                  </span>
                  <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded">
                    Risk Challenge
                  </span>
                </div>
                <p className="text-xs theme-muted leading-relaxed">
                  Challenges baseline against active critical threats, vendor delivery lead times, and SLA penalties.
                </p>
                <div className="text-xs font-mono font-bold text-amber-300 pt-1">
                  Threats Evaluated: {forecastData?.risk_count ?? evaluatedRisks.length} High/Crit items
                </div>
              </div>

              {/* Phase 3 */}
              <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/30 space-y-2 relative">
                <div className="flex items-center justify-between text-xs font-bold text-violet-300">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} />
                    Phase 3: Final Convergence
                  </span>
                  <span className="text-[10px] font-mono bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded">
                    Converged
                  </span>
                </div>
                <p className="text-xs theme-muted leading-relaxed">
                  Stabilizes bounded forecast variance with confidence interval scoring through critique adjustments.
                </p>
                <div className="text-xs font-mono font-bold text-violet-200 pt-1">
                  Result: {fmtVariance(forecastedVariance)} ({confidenceScore}% Confidence)
                </div>
              </div>
            </div>
          </div>

          {/* 6. AI EXECUTIVE NARRATIVE CARD */}
          <div className="p-6 rounded-2xl theme-card border border-white/10 space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 blur-3xl pointer-events-none" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[#FF5A14]" />
                <h3 className="text-sm font-black theme-heading uppercase tracking-wider">
                  AI Reflexion Executive Narrative & Synthesis
                </h3>
              </div>
              <span className="text-[10px] font-mono theme-muted">
                Generated {lastExecuted.toLocaleTimeString()}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-black/40 border border-white/5 font-mono text-xs text-white/90 leading-relaxed">
              {narrative}
            </div>
          </div>

          {/* 7. AI EMERGING & POTENTIAL THREAT RADAR (WHAT RISKS COULD HAPPEN) */}
          <div className="p-6 rounded-2xl theme-card border border-white/10 space-y-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/5 blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between flex-wrap gap-2 relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center text-red-400">
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black theme-heading uppercase tracking-wider flex items-center gap-2">
                    <span>AI Projected Threat Radar — Potential Risks That Could Happen</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                      EMERGING THREATS
                    </span>
                  </h3>
                  <p className="text-[11px] theme-muted mt-0.5">
                    Predictive simulation of compounding delivery bottlenecks, contractual SLA penalties, and estimated financial exposure
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-white/5 border border-white/10 theme-muted">
                {projectedRisks.length} Projected Threats Simulated
              </span>
            </div>

            {/* Projected Risks Grid */}
            {projectedRisks.length === 0 ? (
              <div className="p-8 rounded-xl bg-white/5 border border-white/10 text-center space-y-2 relative z-10">
                <ShieldCheck size={28} className="mx-auto text-emerald-400" />
                <h4 className="text-sm font-bold theme-heading">No Emerging Threats Simulated</h4>
                <p className="text-xs theme-muted max-w-md mx-auto">
                  AI predictive simulation evaluated active milestones and found no emerging systemic bottlenecks.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-1 relative z-10">
              {projectedRisks.map((threat, idx) => {
                const isAdopted = adoptedThreats.has(idx);
                const isAdopting = adoptingThreatId === idx;
                const sevUpper = (threat.severity || 'HIGH').toUpperCase();
                const sevBadgeClass = sevUpper === 'CRITICAL' 
                  ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                  : sevUpper === 'HIGH' 
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';

                return (
                  <div 
                    key={idx}
                    onClick={() => setSelectedThreatModal({ threat, idx })}
                    className="p-5 rounded-xl bg-white/5 hover:bg-white/[0.08] border border-white/10 hover:border-[#FF5A14]/50 transition-all flex flex-col justify-between space-y-4 group relative cursor-pointer hover:shadow-[0_0_25px_rgba(255,90,20,0.15)]"
                  >
                    <div className="space-y-3">
                      {/* Card Header: Category & Severity */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                          {threat.category || 'Delivery Risk'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sevBadgeClass}`}>
                            {threat.severity || 'High'}
                          </span>
                          <div
                            className="text-[10px] theme-muted flex items-center gap-1 group-hover:text-[#FF5A14] transition-colors font-bold px-1.5 py-0.5 rounded bg-white/5 group-hover:bg-[#FF5A14]/10"
                            title="Open Level 5 Interactive Drilldown Modal"
                          >
                            <span>L5</span>
                            <ExternalLink size={10} />
                          </div>
                        </div>
                      </div>

                      {/* Threat Title */}
                      <h4 className="text-sm font-bold theme-heading leading-snug group-hover:text-[#FF7A45] transition-colors">
                        {threat.threat_title}
                      </h4>

                      {/* Likelihood / Probability Progress Bar */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="theme-muted flex items-center gap-1">
                            <Activity size={12} className="text-violet-400" />
                            Probability of Materialization:
                          </span>
                          <span className="font-mono font-bold text-white/90">
                            {threat.probability_pct ?? 75}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-black/30 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full transition-all duration-700"
                            style={{ width: `${Math.min(100, Math.max(0, threat.probability_pct ?? 75))}%` }}
                          />
                        </div>
                      </div>

                      {/* Financial Impact Exposure */}
                      <div className="p-2.5 rounded-lg bg-black/30 border border-white/5 flex items-center justify-between text-xs">
                        <span className="theme-muted">Potential Cost Impact:</span>
                        <span className="font-mono font-bold text-red-400">
                          {fmtCurrency(threat.financial_exposure || 0)}
                        </span>
                      </div>

                      {/* AI Preventive Action */}
                      <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20 space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-violet-300 uppercase tracking-wider">
                          <Lightbulb size={12} className="text-amber-300" />
                          <span>AI Preventive Mitigation</span>
                        </div>
                        <p className="text-[11px] text-white/80 leading-relaxed">
                          {threat.preventive_action || 'Review and approve preventive counter-measures in upcoming governance steerco.'}
                        </p>
                      </div>
                    </div>



                  </div>
                );
              })}
            </div>
            )}
          </div>

          {/* 8. EVALUATED CRITICAL THREATS TABLE (IF ANY) */}
          {evaluatedRisks && evaluatedRisks.length > 0 && (
            <div className="p-6 rounded-2xl theme-card border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-400" />
                  <h3 className="text-sm font-black theme-heading uppercase tracking-wider">
                    Threats Evaluated in Predictive Reflexion Cycle
                  </h3>
                </div>
                <Link
                  to="/risks"
                  className="text-xs text-[#FF5A14] hover:underline flex items-center gap-1 font-bold"
                >
                  View Full Risk Register <ChevronRight size={14} />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b theme-border text-theme-muted uppercase tracking-wider text-[10px]">
                      <th className="pb-3 px-3">Threat / Risk Title</th>
                      <th className="pb-3 px-3">Severity</th>
                      <th className="pb-3 px-3 text-right">Financial Exposure</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y theme-border font-sans">
                    {evaluatedRisks.map((risk, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-3 font-semibold text-white/90">
                          {risk.title}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            risk.severity === 'Critical' 
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}>
                            {risk.severity}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-theme-muted">
                          {risk.financial_impact ? fmtCurrency(risk.financial_impact) : 'Calculated by Agent'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}



        </div>
      )}

      {/* LEVEL 5 PREDICTIVE THREAT DRILLDOWN MODAL */}
      {selectedThreatModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedThreatModal(null)}
        >
          <div 
            className="w-full max-w-2xl rounded-2xl theme-card border border-white/20 p-6 shadow-2xl relative space-y-5 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-[#FF5A14]/15 via-violet-500/10 to-transparent blur-3xl pointer-events-none" />

            {/* Modal Header */}
            <div className="flex items-start justify-between relative z-10 border-b theme-border pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    LEVEL 5 DEEP-DIVE
                  </span>
                  <span className="text-[11px] theme-muted font-mono">
                    AI Predictive Threat Telemetry
                  </span>
                </div>
                <h3 className="text-lg font-black theme-heading">
                  {selectedThreatModal.threat.threat_title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedThreatModal(null)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Metrics Grid */}
            <div className="grid grid-cols-3 gap-3 relative z-10">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-[10px] font-bold theme-muted uppercase tracking-wider">Severity Rating</span>
                <div className="text-sm font-black text-red-400">
                  {selectedThreatModal.threat.severity || 'High'} Impact
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-[10px] font-bold theme-muted uppercase tracking-wider">Occurrence Probability</span>
                <div className="text-sm font-black text-amber-400">
                  {selectedThreatModal.threat.probability_pct ?? 75}% Likelihood
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-[10px] font-bold theme-muted uppercase tracking-wider">Potential Exposure</span>
                <div className="text-sm font-black text-white/90">
                  {fmtCurrency(selectedThreatModal.threat.financial_exposure || 0)}
                </div>
              </div>
            </div>

            {/* Detailed Root Cause & Telemetry Analysis */}
            <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2 relative z-10">
              <div className="flex items-center gap-1.5 text-xs font-bold text-violet-300 uppercase tracking-wider">
                <Brain size={14} className="text-cyan-400" />
                <span>AI Predictive Root Cause Analysis & Scenario Modeling</span>
              </div>
              <p className="text-xs theme-muted leading-relaxed">
                Based on current sprint velocity and variance telemetry for {matchedProject?.name || `Project #${currentProjectId}`}, 
                this risk represents a primary compounding threat. Failure to intercept this early could propagate across concurrent sprint milestones 
                and inflate overall burn rates by up to {fmtCurrency(selectedThreatModal.threat.financial_exposure || 0)}.
              </p>
            </div>

            {/* Actionable Countermeasure Roadmap */}
            <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 space-y-2 relative z-10">
              <div className="flex items-center gap-1.5 text-xs font-bold text-violet-300 uppercase tracking-wider">
                <Lightbulb size={14} className="text-amber-300" />
                <span>Prescriptive Countermeasures & SOP Recommendation</span>
              </div>
              <p className="text-xs theme-muted leading-relaxed font-mono">
                {selectedThreatModal.threat.preventive_action || 'Review and approve preventive counter-measures in upcoming governance steerco.'}
              </p>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t theme-border relative z-10">
              <button
                onClick={() => setSelectedThreatModal(null)}
                className="px-4 py-2 rounded-xl theme-subtle hover:bg-white/10 text-xs font-bold transition-all cursor-pointer"
              >
                Close Drilldown
              </button>

              {adoptedThreats.has(selectedThreatModal.idx) ? (
                <div className="py-2 px-4 text-xs font-bold text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                  <Check size={14} />
                  <span>Added to Official Project Risk Register</span>
                </div>
              ) : (
                <button
                  onClick={() => handleAdoptThreat(selectedThreatModal.threat, selectedThreatModal.idx)}
                  disabled={adoptingThreatId === selectedThreatModal.idx}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] hover:from-[#e04f10] hover:to-[#ff6830] text-white text-xs font-bold shadow-md hover:shadow-[0_0_20px_rgba(255,90,20,0.4)] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {adoptingThreatId === selectedThreatModal.idx ? (
                    <RefreshCw size={13} className="animate-spin" />
                  ) : (
                    <Plus size={13} />
                  )}
                  <span>Add to Official Risk Register</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ForecastDrilldownPage;
