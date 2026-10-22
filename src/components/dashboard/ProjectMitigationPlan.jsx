import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  Clock,
  Calendar,
  Users,
  CheckCircle2,
  ArrowRight,
  ArrowUp,
  RefreshCw,
  Download,
  ExternalLink,
  Layers,
  Activity,
  Filter,
  Search,
  FileText,
  Check,
  Plus,
  ChevronDown,
  ChevronUp,
  Zap,
  BarChart3,
  Flame,
  ShieldAlert,
  Server,
  Lock,
  Briefcase,
  HelpCircle,
  Copy
} from 'lucide-react';

const ProjectMitigationPlan = ({
  project,
  mitigationPlan,
  onRefresh,
  onAdoptStrategy,
  onUpdateStrategyStatus,
  isRefreshing = false
}) => {
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedStrategyId, setExpandedStrategyId] = useState(null);
  const [adoptingId, setAdoptingId] = useState(null);
  const [copiedBrief, setCopiedBrief] = useState(false);

  const plan = mitigationPlan || {};
  const execSummary = plan.executive_summary || {};
  const strategies = plan.strategies || [];
  const roadmap = plan.recovery_roadmap || [];
  const deficits = execSummary.primary_deficits_identified || [];

  const currentHealth = project?.healthScore ?? (project?.health_score ?? (plan.current_health ?? 20));
  const parsedTargetHealth = parseInt(execSummary.projected_health_target || '78', 10);
  const targetHealth = isNaN(parsedTargetHealth) ? 78 : parsedTargetHealth;
  const liftTarget = Math.max(0, targetHealth - currentHealth);

  // Filter strategies
  const filteredStrategies = strategies.filter((item) => {
    const matchesDomain =
      selectedDomain === 'all' ||
      item.domain?.toLowerCase().includes(selectedDomain.toLowerCase()) ||
      (selectedDomain === 'budget' && item.domain?.toLowerCase().includes('budget')) ||
      (selectedDomain === 'schedule' && item.domain?.toLowerCase().includes('schedule')) ||
      (selectedDomain === 'threats' && (item.domain?.toLowerCase().includes('threat') || item.domain?.toLowerCase().includes('security'))) ||
      (selectedDomain === 'vendor' && (item.domain?.toLowerCase().includes('vendor') || item.domain?.toLowerCase().includes('governance')));

    const matchesPriority =
      selectedPriority === 'all' ||
      (selectedPriority === 'p0' && (item.priority?.includes('P0') || item.priority?.toLowerCase().includes('immediate'))) ||
      (selectedPriority === 'p1' && (item.priority?.includes('P1') || item.priority?.toLowerCase().includes('high'))) ||
      (selectedPriority === 'p2' && (item.priority?.includes('P2') || item.priority?.toLowerCase().includes('medium')));

    const matchesSearch =
      !searchQuery ||
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.objective?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.target_deficit?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.owner?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesDomain && matchesPriority && matchesSearch;
  });

  const getDomainColor = (domain = '') => {
    const d = domain.toLowerCase();
    if (d.includes('budget') || d.includes('capital') || d.includes('cost')) {
      return {
        badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        border: 'border-emerald-500/30',
        hoverBorder: 'hover:border-emerald-500/60',
        accentBg: 'bg-emerald-500/10',
        textAccent: 'text-emerald-400',
        icon: <DollarSign size={14} className="text-emerald-400" />
      };
    }
    if (d.includes('schedule') || d.includes('delivery') || d.includes('velocity')) {
      return {
        badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        border: 'border-amber-500/30',
        hoverBorder: 'hover:border-amber-500/60',
        accentBg: 'bg-amber-500/10',
        textAccent: 'text-amber-400',
        icon: <Calendar size={14} className="text-amber-400" />
      };
    }
    if (d.includes('threat') || d.includes('security') || d.includes('risk')) {
      return {
        badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
        border: 'border-rose-500/30',
        hoverBorder: 'hover:border-rose-500/60',
        accentBg: 'bg-rose-500/10',
        textAccent: 'text-rose-400',
        icon: <ShieldAlert size={14} className="text-rose-400" />
      };
    }
    return {
      badge: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
      border: 'border-violet-500/30',
      hoverBorder: 'hover:border-violet-500/60',
      accentBg: 'bg-violet-500/10',
      textAccent: 'text-violet-400',
      icon: <Users size={14} className="text-violet-400" />
    };
  };

  const getPriorityBadge = (priority = '') => {
    if (priority.includes('P0') || priority.toLowerCase().includes('immediate')) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/40">
          Immediate (P0)
        </span>
      );
    }
    if (priority.includes('P1') || priority.toLowerCase().includes('high')) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/40">
          High (P1)
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/40">
        Medium (P2)
      </span>
    );
  };

  const handleDownloadBrief = () => {
    const briefContent = `========================================================================
VPM ENTERPRISE GOVERNANCE SUITE — EXECUTIVE MITIGATION PLAN (SOLUTION PLAN)
========================================================================
Project: ${plan.project_name || project?.name || 'VPM'} (Key: ${plan.project_key || project?.jira_key || 'VPM'})
Generated At: ${plan.updated_at || new Date().toISOString()}
AI Model: ${plan.model_name || 'Autonomous Governance LLM'}
Convergence Status: ${plan.source === 'live_llm' ? 'Live LLM Calibrated' : 'Calibrated Governance Synthesis'}
Confidence Score: ${plan.confidence_score || 95}%

EXECUTIVE SUMMARY & SITUATIONAL ASSESSMENT:
------------------------------------------------------------------------
${execSummary.overall_assessment || 'Executive triage active.'}

Target Recovery Horizon: ${execSummary.target_recovery_horizon || '45-60 Days'}
Projected Cost Recovery: ${execSummary.projected_cost_recovery || '$0.0k'}
Projected Health Target: ${execSummary.projected_health_target || `${targetHealth}%`}

PRIMARY PROJECT DEFICITS IDENTIFIED:
------------------------------------------------------------------------
${deficits
  .map(
    (d, i) => `${i + 1}. [${d.domain}] Severity: ${d.severity}
   - Metric: ${d.metric}
   - Root Cause: ${d.root_cause}`
  )
  .join('\n\n')}

STRATEGIC MITIGATION MATRIX:
------------------------------------------------------------------------
${strategies
  .map(
    (s, i) => `STRATEGY ${i + 1}: [${s.id}] ${s.title}
- Domain: ${s.domain} | Priority: ${s.priority} | Status: ${s.status || 'Recommended'}
- Target Deficit: ${s.target_deficit}
- Owner: ${s.owner} | Timeframe: ${s.timeframe}
- Objective: ${s.objective}
- Action Steps:
${(s.action_steps || []).map((step, idx) => `  ${idx + 1}. ${step}`).join('\n')}
- Expected Outcome: ${s.expected_outcome}
`
  )
  .join('\n------------------------------------------------------------------------\n')}

PHASED RECOVERY ROADMAP:
------------------------------------------------------------------------
${roadmap
  .map(
    (r) => `${r.phase} (${r.timeline}) -> Target Health: ${r.expected_health}
Milestones:
${(r.milestones || []).map((m) => `  * ${m}`).join('\n')}`
  )
  .join('\n\n')}
========================================================================
`;

    const blob = new Blob([briefContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `VPM_Mitigation_Plan_${plan.project_key || 'PRJ'}_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopySummary = () => {
    const summaryText = `[LLM Mitigation Plan] Project: ${project?.name || plan.project_name || 'VPM'} | Health: ${currentHealth}% -> Target: ${execSummary.projected_health_target || `${targetHealth}%`}\nDeficits Addressed: ${deficits.map((d) => d.domain).join(', ')}\nStrategies: ${strategies.length} active playbooks ready for SteerCo review.`;
    navigator.clipboard?.writeText(summaryText);
    setCopiedBrief(true);
    setTimeout(() => setCopiedBrief(false), 2000);
  };

  const onAdoptClick = async (strat) => {
    if (!onAdoptStrategy) return;
    try {
      setAdoptingId(strat.id);
      await onAdoptStrategy(strat);
    } finally {
      setAdoptingId(null);
    }
  };

  return (
    <div
      id="mitigation-plan-section"
      className="p-6 sm:p-8 rounded-3xl theme-card border border-[#FF5A14]/30 shadow-2xl relative overflow-hidden space-y-8 animate-fadeIn"
    >
      {/* Background Ambience Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-[#FF5A14]/10 via-amber-500/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-gradient-to-tr from-violet-600/10 via-emerald-500/5 to-transparent blur-3xl pointer-events-none" />

      {/* 1. EXECUTIVE HEADER & ACTIONS */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 relative z-10">
        <div className="space-y-3 max-w-3xl">
          {/* Badge Ribbon */}
          <div className="flex items-center gap-2 flex-wrap text-[11px] font-bold">
            <span className="px-3 py-1 rounded-full bg-[#FF5A14]/15 text-[#FF5A14] border border-[#FF5A14]/30 flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles size={12} className="animate-spin-slow" />
              <span>AI Autonomous Governance</span>
            </span>

            <span className="px-2.5 py-1 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/30 flex items-center gap-1">
              <Zap size={11} />
              <span>{plan.model_name || 'Autonomous Governance LLM'}</span>
            </span>

            <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck size={11} />
              <span>Confidence: {plan.confidence_score || 95}%</span>
            </span>

            <span className="px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20 font-mono text-[10px]">
              {plan.source === 'live_llm' ? 'Live LLM Calibrated' : 'Calibrated Synthesis'}
            </span>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black theme-heading tracking-tight flex items-center gap-3">
              <span>Mitigation Plan (Solution Plan)</span>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-[#FF5A14]/10 text-[#FF7A45] font-mono border border-[#FF5A14]/20 font-bold">
                Level 4 Strategic Remediation
              </span>
            </h2>
            <p className="text-xs sm:text-sm theme-muted mt-1 leading-relaxed">
              Specific, tailored strategic playbooks synthesized by LLM to directly remediate active project deficits,
              cost variance overruns, milestone delivery lag, and critical threat exposure for{' '}
              <strong className="theme-heading font-semibold">{project?.name || 'VPM Platform'}</strong>.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap self-start relative z-10">
          <button
            onClick={() => {
              const el = document.getElementById('budget-breakdown');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="px-3.5 py-2 rounded-xl theme-subtle border theme-border hover:border-[#FF5A14]/40 text-xs font-bold theme-muted hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
            title="Scroll back to Budget & Deficit Overview"
          >
            <ArrowUp size={13} />
            <span>Back to Budget</span>
          </button>

          <button
            onClick={handleCopySummary}
            className="px-3.5 py-2 rounded-xl theme-subtle border theme-border hover:border-[#FF5A14]/40 text-xs font-bold theme-muted hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
            title="Copy Executive Summary"
          >
            {copiedBrief ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            <span>{copiedBrief ? 'Copied!' : 'Copy Summary'}</span>
          </button>

          <button
            onClick={handleDownloadBrief}
            className="px-3.5 py-2 rounded-xl theme-subtle border theme-border hover:border-[#FF5A14]/40 text-xs font-bold theme-muted hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
            title="Export Formatted Mitigation Brief"
          >
            <Download size={13} />
            <span>Download Brief</span>
          </button>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] hover:brightness-110 text-white text-xs font-bold shadow-lg shadow-[#FF5A14]/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{isRefreshing ? 'Re-Synthesizing...' : 'Re-Calibrate with LLM'}</span>
          </button>
        </div>
      </div>

      {/* 2. RECOVERY TARGET & TRAJECTORY GAUGE */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#FF5A14]/10 via-amber-500/5 to-emerald-500/10 border border-[#FF5A14]/25 relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          {/* Current Health to Target Health */}
          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold theme-heading flex items-center gap-1.5">
                <Activity size={14} className="text-[#FF5A14]" />
                <span>Projected Health Score Recovery Trajectory</span>
              </span>
              <span className="font-mono text-xs font-bold text-emerald-400">
                +{liftTarget}% Lift Target
              </span>
            </div>

            {/* Dynamic visual health bar */}
            <div className="w-full h-3 rounded-full bg-black/40 overflow-hidden flex p-0.5 border border-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-500 to-amber-500 transition-all duration-700"
                style={{ width: `${Math.min(100, Math.max(0, currentHealth))}%` }}
                title={`Current Health: ${currentHealth}%`}
              />
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 via-emerald-400 to-emerald-500 opacity-60 transition-all duration-700"
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(100 - currentHealth, targetHealth - currentHealth)
                  )}%`
                }}
                title={`Target Recovery: ${execSummary.projected_health_target || `${targetHealth}%`}`}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono theme-muted">
              <span>Current Status: <strong className="text-red-400 font-bold">{currentHealth}% Action Required</strong></span>
              <span>Projected Target: <strong className="text-emerald-400 font-bold">{execSummary.projected_health_target || `${targetHealth}%`} Stable Governance</strong></span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="p-3 rounded-xl bg-black/20 border border-white/5 space-y-1">
            <span className="text-[10px] uppercase tracking-wider theme-muted font-bold block">
              Cost Recovery Potential
            </span>
            <div className="text-lg font-black text-emerald-400 font-mono">
              {execSummary.projected_cost_recovery || '$0.0k'}
            </div>
            <p className="text-[10px] theme-muted leading-tight">Claw-back via LLM deficit resolution & audit controls</p>
          </div>

          <div className="p-3 rounded-xl bg-black/20 border border-white/5 space-y-1">
            <span className="text-[10px] uppercase tracking-wider theme-muted font-bold block">
              Stabilization Horizon
            </span>
            <div className="text-lg font-black text-[#FF7A45] font-mono">
              {execSummary.target_recovery_horizon || '45-60 Days'}
            </div>
            <p className="text-[10px] theme-muted leading-tight">Execution horizon across phased recovery milestones</p>
          </div>
        </div>
      </div>

      {/* 3. PRIMARY IDENTIFIED DEFICITS MATRIX (4 CARDS) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs uppercase tracking-wider font-extrabold theme-heading flex items-center gap-2">
            <AlertTriangle size={13} className="text-[#FF5A14]" />
            <span>Project Deficit Root-Cause Diagnostic</span>
          </h3>
          <span className="text-[11px] theme-muted font-mono">{deficits.length} Critical Vectors Evaluated</span>
        </div>

        {deficits.length === 0 ? (
          <div className="p-4 rounded-2xl theme-subtle border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 size={14} className="flex-shrink-0" />
            <span>No critical deficit bottlenecks currently diagnosed by LLM analysis. Project metrics operating within governance baselines.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {deficits.map((def, idx) => {
              const domainColors = getDomainColor(def.domain);
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl theme-subtle border ${domainColors.border} ${domainColors.hoverBorder} transition-all space-y-2.5 relative group`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${domainColors.badge}`}>
                      {def.domain}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        def.severity?.toLowerCase() === 'critical'
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {def.severity}
                    </span>
                  </div>

                  <div>
                    <div className="text-xs font-black font-mono theme-heading leading-tight">
                      {def.metric}
                    </div>
                    <p className="text-[11px] theme-muted mt-1 leading-snug line-clamp-3">
                      {def.root_cause}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. STRATEGIC SOLUTION MATRIX */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b theme-border">
          <div>
            <h3 className="text-sm font-black theme-heading flex items-center gap-2">
              <Target size={15} className="text-[#FF5A14]" />
              <span>Multi-Vector Mitigation Strategies ({filteredStrategies.length})</span>
            </h3>
            <p className="text-xs theme-muted">Actionable intervention playbooks prioritized by criticality</p>
          </div>

          {/* Filtering Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Domain filter */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-black/20 border border-white/5 text-[11px] font-semibold">
              <button
                onClick={() => setSelectedDomain('all')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedDomain === 'all'
                    ? 'bg-[#FF5A14] text-white shadow-sm font-bold'
                    : 'theme-muted hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedDomain('budget')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedDomain === 'budget'
                    ? 'bg-[#FF5A14] text-white shadow-sm font-bold'
                    : 'theme-muted hover:text-white'
                }`}
              >
                Budget
              </button>
              <button
                onClick={() => setSelectedDomain('schedule')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedDomain === 'schedule'
                    ? 'bg-[#FF5A14] text-white shadow-sm font-bold'
                    : 'theme-muted hover:text-white'
                }`}
              >
                Schedule
              </button>
              <button
                onClick={() => setSelectedDomain('threats')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedDomain === 'threats'
                    ? 'bg-[#FF5A14] text-white shadow-sm font-bold'
                    : 'theme-muted hover:text-white'
                }`}
              >
                Threats
              </button>
              <button
                onClick={() => setSelectedDomain('vendor')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedDomain === 'vendor'
                    ? 'bg-[#FF5A14] text-white shadow-sm font-bold'
                    : 'theme-muted hover:text-white'
                }`}
              >
                Vendor
              </button>
            </div>

            {/* Priority filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl theme-subtle border theme-border text-xs font-semibold theme-muted cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="p0">Immediate (P0)</option>
              <option value="p1">High (P1)</option>
              <option value="p2">Medium (P2)</option>
            </select>
          </div>
        </div>

        {/* Strategy Cards List */}
        {filteredStrategies.length === 0 ? (
          <div className="p-8 text-center rounded-2xl theme-subtle border theme-border space-y-2">
            <CheckCircle2 size={24} className="mx-auto text-emerald-400" />
            <p className="text-sm font-semibold theme-heading">No active mitigation playbooks found for current filter.</p>
            <p className="text-xs theme-muted">Select "All" domains or click "Re-Calibrate with LLM" to generate updated strategic playbooks.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredStrategies.map((strat, idx) => {
            const domainColors = getDomainColor(strat.domain);
            const isExpanded = expandedStrategyId === strat.id || (!expandedStrategyId && idx === 0);
            const isAdopted = strat.status?.toLowerCase() === 'adopted';

            return (
              <div
                key={strat.id || idx}
                className={`p-5 rounded-2xl theme-subtle border ${domainColors.border} ${domainColors.hoverBorder} transition-all space-y-4`}
              >
                {/* Strategy Card Top Line */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-black text-[#FF7A45] px-2 py-0.5 rounded bg-black/30 border border-white/5">
                      [{strat.id}]
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${domainColors.badge}`}>
                      {strat.domain}
                    </span>
                    {getPriorityBadge(strat.priority)}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                        isAdopted
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-slate-500/15 text-slate-300 border border-slate-500/30'
                      }`}
                    >
                      {strat.status || 'Recommended'}
                    </span>
                  </div>

                  {/* Actions on Top Right */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onAdoptClick(strat)}
                      disabled={adoptingId === strat.id || isAdopted}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        isAdopted
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                          : 'bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white hover:brightness-110 shadow-sm'
                      }`}
                    >
                      {isAdopted ? (
                        <>
                          <Check size={12} />
                          <span>Adopted to Backlog</span>
                        </>
                      ) : (
                        <>
                          <Plus size={12} className={adoptingId === strat.id ? 'animate-spin' : ''} />
                          <span>{adoptingId === strat.id ? 'Adopting...' : 'Adopt into Backlog'}</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setExpandedStrategyId(isExpanded ? '__none__' : strat.id)}
                      className="p-1.5 rounded-xl theme-card border theme-border hover:border-[#FF5A14]/40 theme-muted hover:text-white transition-all cursor-pointer"
                      title={isExpanded ? 'Collapse Playbook' : 'Expand Full Playbook'}
                    >
                      {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                  </div>
                </div>

                {/* Title & Target Deficit */}
                <div>
                  <h4 className="text-base font-extrabold theme-heading leading-tight flex items-center gap-2">
                    <span>{strat.title}</span>
                  </h4>
                  <div className="flex items-center gap-2 text-xs theme-muted mt-1 flex-wrap">
                    <span className="font-semibold text-rose-400 flex items-center gap-1">
                      <Target size={12} />
                      <span>Target Deficit: {strat.target_deficit}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      <span>Owner: <strong className="theme-heading">{strat.owner}</strong></span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>Horizon: <strong className="theme-heading">{strat.timeframe}</strong></span>
                    </span>
                  </div>
                </div>

                {/* Objective Narrative */}
                <p className="text-xs sm:text-sm theme-muted leading-relaxed">
                  {strat.objective}
                </p>

                {/* Collapsible Action Steps Playbook */}
                {isExpanded && (
                  <div className="pt-3 border-t theme-border space-y-3 animate-fadeIn">
                    <div className="text-xs font-black uppercase tracking-wider theme-heading flex items-center gap-1.5">
                      <Zap size={13} className="text-[#FF5A14]" />
                      <span>Execution Playbook & Action Steps:</span>
                    </div>

                    <div className="space-y-2">
                      {(strat.action_steps || []).map((step, sIdx) => (
                        <div
                          key={sIdx}
                          className="flex items-start gap-2.5 p-2.5 rounded-xl bg-black/25 border border-white/5 text-xs theme-muted leading-relaxed"
                        >
                          <span className="w-5 h-5 rounded-full bg-[#FF5A14]/20 text-[#FF5A14] flex items-center justify-center font-mono text-[10px] font-bold flex-shrink-0 mt-0.5">
                            {sIdx + 1}
                          </span>
                          <span className="flex-1 theme-body font-medium">{step}</span>
                        </div>
                      ))}
                    </div>

                    {/* Expected Outcome callout */}
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-2 text-xs">
                      <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-emerald-400 font-bold block mb-0.5">Projected Measurable Outcome:</strong>
                        <span className="theme-muted">{strat.expected_outcome}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        )}
      </div>

      {/* 5. PHASED RECOVERY ROADMAP (3 STAGES) */}
      <div className="space-y-4 pt-4 border-t theme-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black theme-heading flex items-center gap-2">
              <Calendar size={15} className="text-[#FF5A14]" />
              <span>Phased Stabilization & Recovery Roadmap</span>
            </h3>
            <p className="text-xs theme-muted">Chronological stage gates to transition project from {currentHealth}% to Green Governance</p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30">
            {execSummary.target_recovery_horizon || 'Phased Horizon'}
          </span>
        </div>

        {roadmap.length === 0 ? (
          <div className="p-5 text-center rounded-2xl theme-subtle border theme-border space-y-1">
            <p className="text-xs font-semibold theme-heading">Phased recovery roadmap will populate upon LLM strategy calibration.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {roadmap.map((phase, pIdx) => (
              <div
                key={pIdx}
                className="p-4 rounded-2xl theme-subtle border border-white/10 hover:border-[#FF5A14]/40 transition-all space-y-3 relative group"
              >
                {/* Phase header */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-black text-[#FF7A45]">
                    Stage 0{pIdx + 1}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                    Target Health: {phase.expected_health}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-extrabold theme-heading leading-tight">
                    {phase.phase}
                  </h4>
                  <span className="text-[11px] font-mono text-[#FF5A14] font-semibold block mt-0.5">
                    {phase.timeline}
                  </span>
                </div>

                {/* Milestones in this phase */}
                <div className="space-y-1.5 pt-2 border-t theme-border text-xs theme-muted">
                  {(phase.milestones || []).map((m, mIdx) => (
                    <div key={mIdx} className="flex items-center gap-1.5 text-[11px]">
                      <CheckCircle2 size={12} className="text-emerald-400 flex-shrink-0" />
                      <span className="line-clamp-1">{m}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectMitigationPlan;
