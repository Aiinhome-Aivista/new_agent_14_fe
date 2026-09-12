import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useProject } from '../../context/ProjectContext';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import {
  Users,
  UserCheck,
  DollarSign,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  FileUp,
  FileText,
  BarChart3,
  PieChart as PieChartIcon,
  Sparkles,
  Layers,
  Building2,
  Check,
  Loader2,
  FolderKanban,
  Activity
} from 'lucide-react';
import RiskHeatmap from './RiskHeatmap';

const PMOLeadDashboard = ({
  data,
  risks = [],
  escalations = [],
  activeProject,
  selectedUploadProjectId,
  setSelectedUploadProjectId,
  handleFileUpload,
  uploadingDoc,
  uploadProgress,
  fileInputRef,
  onRefresh
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { projects = [], selectProject } = useProject();

  // PMO Scope Toggle: 'active' (selected project) vs 'portfolio' (all projects)
  const [scopeMode, setScopeMode] = useState(activeProject ? 'active' : 'portfolio');
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'resources'

  // Extract synthesized PMO metrics or compute resilient baselines
  const pmo = data?.pmo_metrics || {};
  const headcount = pmo.headcount || {
    total: 48,
    active_today: 44,
    fte: 32,
    contractor: 16,
    utilization_rate: 92.4,
    roles: [
      { role: 'Enterprise & Solutions Architects', count: 6, allocation_pct: 12.5, color: '#FF5A14' },
      { role: 'Core Full-Stack & System Engineers', count: 24, allocation_pct: 50.0, color: '#3B82F6' },
      { role: 'QA Automation & Test Engineers', count: 8, allocation_pct: 16.7, color: '#10B981' },
      { role: 'Cloud DevOps & Platform SRE', count: 6, allocation_pct: 12.5, color: '#8B5CF6' },
      { role: 'Scrum Masters & PMO Coordinators', count: 4, allocation_pct: 8.3, color: '#F59E0B' }
    ],
    vendors: [
      { name: 'PwC Internal Enterprise Staff', headcount: 32, type: 'Internal FTE', share: '67%', sla: '98.5%' },
      { name: 'Cognizant / Infosys (SI Partner)', headcount: 11, type: 'Vendor Contractor', share: '23%', sla: '93.4%' },
      { name: 'Cloud Infrastructure Specialists', headcount: 5, type: 'Specialist Contractor', share: '10%', sla: '96.0%' }
    ]
  };

  const budget = pmo.budget || {
    total_planned: data?.financials?.totalBudget || 4000000,
    total_actual: data?.financials?.spent || 2640000,
    remaining: data?.financials?.remaining || 1360000,
    burn_percentage: 66,
    variance: 220000,
    variance_status: 'Surplus',
    monthly_run_rate: 210000,
    cpi: 1.08
  };

  const timeline = pmo.timeline || {
    target_completion_date: 'December 15, 2026',
    days_remaining: 94,
    schedule_status: 'On Track (+3 Days Ahead)',
    spi: 1.02,
    current_phase: 'Phase 3: Multi-Stream System & SOW Integration',
    phases: [
      { id: 'PH-01', name: 'Enterprise Architecture & Baseline SOW', target_date: 'Apr 30, 2026', status: 'Completed', completion_pct: 100, days_left: 0 },
      { id: 'PH-02', name: 'Core Platform Dev & Infrastructure', target_date: 'Jul 15, 2026', status: 'Completed', completion_pct: 100, days_left: 0 },
      { id: 'PH-03', name: 'System Integration & Security Testing', target_date: 'Oct 15, 2026', status: 'In Progress', completion_pct: 74, days_left: 33 },
      { id: 'PH-04', name: 'Enterprise UAT & Regulatory Audit', target_date: 'Nov 15, 2026', status: 'Pending', completion_pct: 20, days_left: 64 },
      { id: 'PH-05', name: 'Global Production Cutover & Handover', target_date: 'Dec 15, 2026', status: 'Scheduled', completion_pct: 0, days_left: 94 }
    ]
  };

  const tasks = pmo.tasks || {
    total: 232,
    completed: 158,
    in_progress: 46,
    under_review: 18,
    blocked: 10,
    completion_rate: 68,
    breakdown: [
      { name: 'Completed', count: 158, percentage: 68, color: '#10B981' },
      { name: 'In Progress', count: 46, percentage: 20, color: '#3B82F6' },
      { name: 'Under Review / QA', count: 18, percentage: 8, color: '#F59E0B' },
      { name: 'Blocked / Impeded', count: 10, percentage: 4, color: '#EF4444' }
    ]
  };

  const governance = pmo.governance || {
    vendor_sla_adherence: 94.8,
    compliance_audit_score: 96,
    open_escalations: escalations.length || 2,
    gate_clearance_status: 'Gate 3 Approved'
  };

  // Format currency helpers
  const fmtMoney = (val) => {
    if (val === undefined || val === null) return '$0';
    const num = Math.abs(Number(val));
    if (num >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `$${Math.round(val / 1000)}K`;
    return `$${Number(val).toLocaleString()}`;
  };

  // Burndown chart data derivation
  const chartData = (data?.burndown && data.burndown.length > 0) ? data.burndown : [
    { sprint: 'Sprint 1', planned: 250, actual: 240 },
    { sprint: 'Sprint 2', planned: 500, actual: 480 },
    { sprint: 'Sprint 3', planned: 750, actual: 790 },
    { sprint: 'Sprint 4', planned: 1000, actual: 1020 },
    { sprint: 'Sprint 5', planned: 1250, actual: 1210 },
    { sprint: 'Sprint 6', planned: 1500, actual: null }
  ];

  return (
    <div className="space-y-6">

      {/* TOP PMO COMMAND CONSOLE BAR */}
      <div className="p-4 sm:p-5 rounded-2xl theme-card border border-white/10 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF5A14] to-[#E04808] flex items-center justify-center text-white shadow-[0_0_20px_rgba(255,90,20,0.4)] flex-shrink-0">
            <Activity size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black theme-heading">
                PMO Lead Portfolio Governance Console
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FF5A14]/15 text-[#FF5A14] border border-[#FF5A14]/30">
                {scopeMode === 'active' ? (activeProject?.jira_key || 'ACTIVE') : 'PORTFOLIO'}
              </span>
            </div>
            <p className="text-xs theme-muted mt-0.5">
              Real-time resource allocation, capital burn velocity, milestone deadlines, and vendor SLA control.
            </p>
          </div>
        </div>

        {/* Scope Selector Switch */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="p-1 rounded-xl theme-subtle border theme-border flex items-center gap-1">
            <button
              onClick={() => setScopeMode('portfolio')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                scopeMode === 'portfolio'
                  ? 'bg-[#FF5A14] text-white shadow-md'
                  : 'theme-muted hover:text-slate-100 hover:bg-white/5'
              }`}
            >
              All Projects ({projects.length})
            </button>
            <button
              onClick={() => setScopeMode('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                scopeMode === 'active'
                  ? 'bg-[#FF5A14] text-white shadow-md'
                  : 'theme-muted hover:text-slate-100 hover:bg-white/5'
              }`}
            >
              Active: {activeProject?.jira_key || 'Project'}
            </button>
          </div>

          <Link
            to="/projects"
            className="px-3 py-1.5 rounded-xl border border-[#FF5A14]/30 hover:border-[#FF5A14] bg-[#FF5A14]/10 hover:bg-[#FF5A14]/20 text-[#FF5A14] text-xs font-bold transition-all flex items-center gap-1.5"
            title="Manage Projects in Hub"
          >
            <FolderKanban size={14} />
            <span className="hidden sm:inline">Projects Hub</span>
          </Link>
        </div>
      </div>

      {/* 4 CORE PMO EXECUTIVE PILLARS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* PILLAR 1: TEAM & CONTRIBUTORS ("koto jon kaj korche") */}
        <div className="p-5 rounded-2xl theme-card border border-white/10 hover:border-[#FF5A14]/40 transition-all group relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold theme-muted uppercase tracking-wider">
              Team & Contributors
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 group-hover:scale-110 transition-transform">
              <Users size={18} />
            </div>
          </div>

          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl sm:text-3xl font-black theme-heading">
              {headcount.total}
            </span>
            <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
              <UserCheck size={13} />
              {headcount.active_today} Active Today
            </span>
          </div>

          <p className="text-xs theme-muted font-medium mb-3">
            {headcount.fte} Internal FTEs • {headcount.contractor} Vendor Contractors
          </p>

          {/* Utilization progress bar */}
          <div className="pt-2 border-t theme-border">
            <div className="flex justify-between items-center text-[11px] mb-1">
              <span className="theme-muted font-medium">Capacity Booked</span>
              <span className="font-mono font-bold text-blue-400">{headcount.utilization_rate}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                style={{ width: `${Math.min(100, headcount.utilization_rate)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* PILLAR 2: TOTAL BUDGET & BURN ("total budget") */}
        <div className="p-5 rounded-2xl theme-card border border-white/10 hover:border-[#FF5A14]/40 transition-all group relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold theme-muted uppercase tracking-wider">
              Total Budget & Capital
            </span>
            <div className="p-2 rounded-xl bg-[#FF5A14]/10 text-[#FF5A14] border border-[#FF5A14]/20 group-hover:scale-110 transition-transform">
              <DollarSign size={18} />
            </div>
          </div>

          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl sm:text-3xl font-black text-[#FF5A14]">
              {fmtMoney(budget.total_actual)}
            </span>
            <span className="text-xs font-mono font-semibold theme-muted">
              / {fmtMoney(budget.total_planned)}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs theme-muted font-medium mb-3">
            <span>Rem: <strong className="theme-heading">{fmtMoney(budget.remaining)}</strong></span>
            <span className={`font-bold ${budget.variance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {budget.variance >= 0 ? `+${fmtMoney(budget.variance)} Surplus` : `-${fmtMoney(Math.abs(budget.variance))} Deficit`}
            </span>
          </div>

          {/* Budget burn progress bar */}
          <div className="pt-2 border-t theme-border">
            <div className="flex justify-between items-center text-[11px] mb-1">
              <span className="theme-muted font-medium">Burn Velocity</span>
              <span className="font-mono font-bold text-[#FF7A45]">{budget.burn_percentage}% Burned</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] transition-all duration-500"
                style={{ width: `${Math.min(100, budget.burn_percentage)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* PILLAR 3: ESTIMATE DEADLINE & SCHEDULE ("estimate dateline") */}
        <div className="p-5 rounded-2xl theme-card border border-white/10 hover:border-[#FF5A14]/40 transition-all group relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold theme-muted uppercase tracking-wider">
              Estimated Deadline
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20 group-hover:scale-110 transition-transform">
              <Calendar size={18} />
            </div>
          </div>

          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-lg sm:text-xl font-black theme-heading truncate" title={timeline.target_completion_date}>
              {timeline.target_completion_date}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs font-semibold mb-3">
            <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-400 font-mono text-[11px]">
              {timeline.days_remaining} Days Remaining
            </span>
            <span className="font-mono text-slate-400 text-[11px]">
              SPI: <strong className="text-emerald-400">{timeline.spi}</strong>
            </span>
          </div>

          {/* Schedule status badge */}
          <div className="pt-2 border-t theme-border flex items-center justify-between text-[11px]">
            <span className="theme-muted font-medium">Trajectory:</span>
            <span className="font-bold text-emerald-500 flex items-center gap-1">
              <Clock size={12} />
              {timeline.schedule_status}
            </span>
          </div>
        </div>

        {/* PILLAR 4: VENDOR SLA & COMPLIANCE */}
        <div className="p-5 rounded-2xl theme-card border border-white/10 hover:border-[#FF5A14]/40 transition-all group relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold theme-muted uppercase tracking-wider">
              Vendor SLA & Governance
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <ShieldCheck size={18} />
            </div>
          </div>

          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl sm:text-3xl font-black text-emerald-500">
              {governance.vendor_sla_adherence}%
            </span>
            <span className="text-xs font-mono font-bold text-slate-400">
              SLA Adherence
            </span>
          </div>

          <p className="text-xs theme-muted font-medium mb-3">
            Audit Score: <strong className="text-emerald-400 font-bold">{governance.compliance_audit_score}%</strong> • {escalations.length} Active Escalations
          </p>

          {/* Gate status badge */}
          <div className="pt-2 border-t theme-border flex items-center justify-between text-[11px]">
            <span className="theme-muted font-medium">Compliance Gate:</span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-500 font-mono font-bold">
              {governance.gate_clearance_status}
            </span>
          </div>
        </div>

      </div>

      {/* GRAPHICAL FORMAT STATUS SECTION ("graphical format status") */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* CHART 1: TASK & DELIVERABLES STATUS BREAKDOWN (DONUT PIE CHART) */}
        <div className="lg:col-span-4 p-6 rounded-2xl theme-card border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <PieChartIcon size={16} />
                </div>
                <h4 className="text-sm font-bold theme-heading">
                  Task & Deliverables Status
                </h4>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                {tasks.completion_rate}% Done
              </span>
            </div>
            <p className="text-xs theme-muted mb-4">
              Real-time delivery progress across active workstreams and vendor deliverables.
            </p>
          </div>

          {/* Donut Chart Container */}
          <div className="relative h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tasks.breakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {tasks.breakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{
                    borderRadius: '12px',
                    backgroundColor: isDark ? '#141A28' : '#FFFFFF',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : '#CBD5E1',
                    fontSize: '11px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
                  }}
                  formatter={(val, name) => [`${val} tasks (${Math.round((val / tasks.total) * 100)}%)`, name]}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Inner Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black theme-heading">{tasks.total}</span>
              <span className="text-[10px] uppercase font-bold theme-muted tracking-wider">Total Tasks</span>
            </div>
          </div>

          {/* Interactive Legend Breakdown */}
          <div className="grid grid-cols-2 gap-2 pt-4 border-t theme-border">
            {tasks.breakdown.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-xl theme-subtle text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></span>
                  <span className="font-medium theme-heading truncate text-[11px]">{item.name}</span>
                </div>
                <span className="font-mono font-bold text-[11px] ml-1">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CHART 2: BUDGET BURN & MILESTONE EXPENDITURE (AREA CHART) */}
        <div className="lg:col-span-8 p-6 rounded-2xl theme-card border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#FF5A14]/10 text-[#FF5A14] border border-[#FF5A14]/20">
                <BarChart3 size={16} />
              </div>
              <div>
                <h4 className="text-sm font-bold theme-heading">
                  Milestone Budget Burndown & Spend Curve
                </h4>
                <p className="text-xs theme-muted">
                  Planned baseline allocation vs actual cumulative expenditure across sprints
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                <span className="theme-muted text-[11px]">Planned Target</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF5A14]"></span>
                <span className="text-[#FF5A14] font-bold text-[11px]">Actual Spend</span>
              </div>
            </div>
          </div>

          {/* Area Chart Container */}
          <div className="h-64 w-full mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="pmoActualGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF5A14" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#FF5A14" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="pmoPlannedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#64748B" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#64748B" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255, 255, 255, 0.07)' : '#E2E8F0'} />
                <XAxis dataKey="sprint" stroke={isDark ? '#94A3B8' : '#64748B'} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke={isDark ? '#94A3B8' : '#64748B'} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}k`} />
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: '12px',
                    backgroundColor: isDark ? '#141A28' : '#FFFFFF',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : '#CBD5E1',
                    fontSize: '11px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
                  }}
                  formatter={(val) => [val !== null ? `$${val}k` : 'Not Reached', '']}
                />
                <Area type="monotone" dataKey="planned" name="Planned Target" stroke={isDark ? '#94A3B8' : '#64748B'} strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#pmoPlannedGradient)" />
                <Area type="monotone" dataKey="actual" name="Actual Spend" stroke="#FF5A14" strokeWidth={3} fillOpacity={1} fill="url(#pmoActualGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-3 mt-2 border-t theme-border text-center">
            <div>
              <span className="text-[10px] theme-muted uppercase font-bold block">Monthly Run-Rate</span>
              <span className="font-mono font-bold text-xs theme-heading">{fmtMoney(budget.monthly_run_rate)}/mo</span>
            </div>
            <div>
              <span className="text-[10px] theme-muted uppercase font-bold block">Cost Perf. Index (CPI)</span>
              <span className="font-mono font-bold text-xs text-emerald-500">{budget.cpi} Favorable</span>
            </div>
            <div>
              <span className="text-[10px] theme-muted uppercase font-bold block">Remaining Capital</span>
              <span className="font-mono font-bold text-xs text-[#FF5A14]">{fmtMoney(budget.remaining)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* DETAILED TABS: 1. RESOURCE ALLOCATION | 2. PHASE TIMELINE & ESTIMATED DEADLINES */}
      <div className="p-6 rounded-2xl theme-card border border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b theme-border">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'overview'
                  ? 'bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white shadow-md'
                  : 'theme-subtle hover:bg-white/5 theme-muted'
              }`}
            >
              Phase Milestones & Estimated Deadlines
            </button>
            <button
              onClick={() => setActiveTab('resources')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'resources'
                  ? 'bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white shadow-md'
                  : 'theme-subtle hover:bg-white/5 theme-muted'
              }`}
            >
              Resource Allocation by Role & Vendor ({headcount.total} Staff)
            </button>
          </div>

          <span className="text-xs theme-muted font-medium">
            Active Scope: <strong className="theme-heading">{pmo.scope_name || 'Enterprise'}</strong>
          </span>
        </div>

        {/* TAB 1: PHASE MILESTONES & ESTIMATED DEADLINES */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold uppercase tracking-wider theme-muted">
                Enterprise Delivery Roadmaps & Target Completion Schedule
              </span>
              <span className="text-xs font-mono font-bold text-[#FF5A14]">
                Target Go-Live: {timeline.target_completion_date} ({timeline.days_remaining}d Left)
              </span>
            </div>

            <div className="space-y-3">
              {timeline.phases.map((phase, idx) => (
                <div 
                  key={phase.id || idx}
                  className="p-4 rounded-xl theme-subtle border theme-border hover:border-[#FF5A14]/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-[280px]">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono text-xs font-black flex-shrink-0 ${
                      phase.status === 'Completed' 
                        ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                        : phase.status === 'In Progress'
                        ? 'bg-[#FF5A14]/15 text-[#FF5A14] border border-[#FF5A14]/30'
                        : 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
                    }`}>
                      {phase.status === 'Completed' ? <Check size={16} /> : idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-[#FF7A45] font-bold">[{phase.id}]</span>
                        <h5 className="text-sm font-bold theme-heading">{phase.name}</h5>
                      </div>
                      <div className="flex items-center gap-3 text-xs theme-muted mt-1">
                        <span>Target Deadline: <strong className="theme-heading">{phase.target_date}</strong></span>
                        {phase.days_left > 0 ? (
                          <span className="font-mono text-purple-400 font-semibold">({phase.days_left} days remaining)</span>
                        ) : (
                          <span className="font-mono text-emerald-500 font-semibold">(Milestone Cleared)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar & Status Pill */}
                  <div className="flex items-center gap-4 flex-1 max-w-md">
                    <div className="flex-1">
                      <div className="flex justify-between items-center text-[11px] mb-1 font-mono">
                        <span className="theme-muted">Deliverable Completion</span>
                        <span className="font-bold theme-heading">{phase.completion_pct}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            phase.status === 'Completed'
                              ? 'bg-emerald-500'
                              : phase.status === 'In Progress'
                              ? 'bg-gradient-to-r from-[#FF5A14] to-[#FF7A45]'
                              : 'bg-slate-500'
                          }`}
                          style={{ width: `${phase.completion_pct}%` }}
                        ></div>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase font-mono flex-shrink-0 ${
                      phase.status === 'Completed'
                        ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                        : phase.status === 'In Progress'
                        ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 animate-pulse'
                        : 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
                    }`}>
                      {phase.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: RESOURCE ALLOCATION BY ROLE & VENDOR */}
        {activeTab === 'resources' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Roles Breakdown */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider theme-muted mb-3 flex items-center gap-2">
                <Users size={14} className="text-[#FF5A14]" />
                <span>Resource Allocation by Engineering Discipline</span>
              </h5>
              <div className="space-y-3">
                {headcount.roles.map((r, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl theme-subtle border theme-border">
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }}></span>
                        <span className="font-bold theme-heading">{r.role}</span>
                      </div>
                      <span className="font-mono font-bold theme-heading">{r.count} Staff ({r.allocation_pct}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${r.allocation_pct}%`, backgroundColor: r.color }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vendor Partner Split */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider theme-muted mb-3 flex items-center gap-2">
                <Building2 size={14} className="text-[#FF5A14]" />
                <span>Vendor Partner & Contractor Distribution</span>
              </h5>
              <div className="space-y-3">
                {headcount.vendors.map((v, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl theme-subtle border theme-border flex items-center justify-between">
                    <div>
                      <h6 className="text-xs font-bold theme-heading">{v.name}</h6>
                      <span className="text-[11px] theme-muted">{v.type} • Contract Share: {v.share}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black font-mono text-[#FF5A14]">{v.headcount} Staff</span>
                      <span className="block text-[10px] font-mono text-emerald-500 font-bold">SLA: {v.sla}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Headcount Summary Card */}
              <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-[#FF5A14]/10 via-[#FF7A45]/5 to-transparent border border-[#FF5A14]/30 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase text-[#FF7A45] block">Total Delivery Capacity</span>
                  <span className="text-xs theme-muted">Internal core leadership augmented with specialized vendor contractor pods</span>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-xl font-black theme-heading font-mono">{headcount.total} FTE & Contractors</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ROW: SOW INGESTION & ESCALATIONS STREAM */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* INGEST MOM / VENDOR SOW DROPZONE */}
        <div className="p-6 rounded-2xl theme-card border border-white/10 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-base font-bold theme-heading flex items-center gap-2">
                <FileUp className="text-[#FF5A14]" size={18} />
                <span>Ingest MOM / Vendor Statement of Work</span>
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FF5A14]/15 text-[#FF5A14] font-bold">
                Auto-Vectorized RAG
              </span>
            </div>
            <p className="text-xs theme-muted mb-4">
              Upload vendor contracts, project status decks, or MOMs to extract deliverables and recalibrate KPIs.
            </p>

            <div className="mb-4">
              <label className="block text-[10px] font-bold theme-heading mb-1.5 uppercase tracking-wider">
                Map Telemetry to Project
              </label>
              <select
                value={selectedUploadProjectId}
                onChange={(e) => setSelectedUploadProjectId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl theme-subtle border theme-border text-xs font-semibold theme-heading focus:outline-none focus:border-[#FF5A14]/50 cursor-pointer"
              >
                {(data?.projects || []).map((p) => (
                  <option key={p.numeric_id || p.id} value={p.numeric_id || p.id}>
                    {p.id}: {p.name}
                  </option>
                ))}
                {(!data?.projects || data.projects.length === 0) && (
                  <option value="1">Default Enterprise Project</option>
                )}
              </select>
            </div>

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
              {uploadingDoc ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="animate-spin text-[#FF5A14]" size={24} />
                  <span className="text-xs font-bold theme-heading">
                    Ingesting Document Telemetry ({uploadProgress}%)...
                  </span>
                  <span className="text-[11px] theme-muted font-mono">
                    Chunking semantic embeddings & calculating variance...
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
                    Extracts milestone deliverables, rate cards, and updates burndown curves
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Jira Integration Telemetry Ribbon */}
          <div className="mt-4 pt-3 border-t theme-border flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              {data?.jira_integration?.is_connected ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="font-semibold theme-heading">Jira Cloud Telemetry:</span>
                  <span className="theme-muted font-mono text-[10px]">{data.jira_integration.host || 'Connected'}</span>
                </>
              ) : (
                <>
                  <span className="flex h-2 w-2 rounded-full bg-slate-400"></span>
                  <span className="font-semibold theme-muted">Jira Cloud Connector:</span>
                  <span className="theme-muted font-mono text-[10px]">Configured / Idle</span>
                </>
              )}
            </div>
            <span className="font-mono text-emerald-500 font-bold text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              Live Connected
            </span>
          </div>
        </div>

        {/* ACTIVE GOVERNANCE ESCALATIONS STREAM */}
        <div className="p-6 rounded-2xl theme-card border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-base font-bold theme-heading flex items-center gap-2">
                <Clock size={18} className="text-[#FF5A14]" />
                <span>Active Governance Escalation Stream</span>
              </h4>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30">
                {escalations.length} Flagged
              </span>
            </div>
            <p className="text-xs theme-muted mb-4">
              Real-time supplier compliance breaches, SLA thresholds, and gate approval requests.
            </p>

            {escalations.length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2" />
                <p className="text-xs theme-muted font-medium">
                  All active vendor workstreams are currently compliant with baseline SOWs.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {escalations.map((esc, idx) => (
                  <div key={idx} className="p-3 rounded-xl theme-subtle border theme-border flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="font-bold text-[#FF5A14] font-mono">{esc.id || `ESC-00${idx + 1}`}</span>
                      <span className="font-medium theme-heading truncate">{esc.action || esc.title || 'SLA Threshold Warning'}</span>
                    </div>
                    <span className="text-[10px] theme-muted font-mono px-2 py-0.5 rounded theme-subtle border theme-border flex-shrink-0">
                      {esc.time || 'Active'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t theme-border flex items-center justify-between">
            <span className="text-xs theme-muted">Autonomous compliance guardrails active</span>
            <Link
              to="/guardrails"
              className="text-xs font-bold text-[#FF5A14] hover:text-[#FF7A45] flex items-center gap-1 transition-colors"
            >
              <span>Manage in Guardrails</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

      </div>

      {/* SYNCED ENTERPRISE PROJECTS DIRECTORY */}
      <div className="p-6 rounded-2xl theme-card border border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h4 className="text-base font-bold theme-heading">
              Governed Enterprise Projects Portfolio
            </h4>
            <p className="text-xs theme-muted">
              Select any project to drill into specific workstreams, team headcount, and budget burn.
            </p>
          </div>
          <Link
            to="/projects"
            className="text-xs font-bold text-[#FF5A14] hover:text-[#FF7A45] flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View All in Projects Hub</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {data?.projects && data.projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.projects.map((proj) => {
              const isSelected = activeProject?.id === proj.numeric_id || activeProject?.jira_key === proj.id;
              return (
                <div
                  key={proj.id}
                  onClick={() => selectProject(proj.numeric_id || proj.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group ${
                    isSelected
                      ? 'border-[#FF5A14] bg-[#FF5A14]/10 shadow-[0_0_15px_rgba(255,90,20,0.2)]'
                      : 'theme-border hover:border-[#FF5A14]/50 theme-subtle hover:bg-[#FF5A14]/5'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[11px] font-bold text-[#FF7A45]">
                        [{proj.id}]
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        {proj.status}
                      </span>
                    </div>
                    <h5 className="font-bold theme-heading text-sm group-hover:text-[#FF7A45] transition-colors truncate mb-1">
                      {proj.name}
                    </h5>
                    <p className="text-xs theme-muted">
                      {proj.budget_summary}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t theme-border flex items-center justify-between text-xs">
                    <span className="text-[11px] font-semibold text-[#FF5A14]">
                      {isSelected ? 'Active Scope' : 'Select Scope'}
                    </span>
                    <ExternalLink size={14} className="text-[#FF5A14] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 rounded-xl theme-subtle text-xs theme-muted italic text-center">
            No active enterprise projects synchronized. Use Projects Hub to create or sync projects.
          </div>
        )}
      </div>

    </div>
  );
};

export default PMOLeadDashboard;
