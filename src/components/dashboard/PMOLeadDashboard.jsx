import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  CartesianGrid,
  ReferenceLine
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
  FileText,
  BarChart3,
  PieChart as PieChartIcon,
  Sparkles,
  Layers,
  Building2,
  Check,
  FolderKanban,
  Activity,
  X,
  ArrowUpRight,
  ExternalLink,
  Filter,
  HelpCircle,
  Briefcase,
  ChevronRight,
  Zap,
  AlertCircle
} from 'lucide-react';
import RiskHeatmap from './RiskHeatmap';
import ProjectThreatRegister from './ProjectThreatRegister';

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
  onRefresh,
  title = "PMO Lead Portfolio Governance Console"
}) => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { projects = [], selectProject } = useProject();

  // PMO Scope Toggle: 'active' (selected project) vs 'portfolio' (all projects)
  const scopeMode = 'active';
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'resources'
  const [activeDrilldown, setActiveDrilldown] = useState(null); // 'team' | 'budget' | 'deadline' | 'governance' | 'tasks' | 'phase'
  const [taskFilter, setTaskFilter] = useState('ALL');
  const [selectedPhase, setSelectedPhase] = useState(null);

  // Extract synthesized PMO metrics dynamically
  const pmo = data?.pmo_metrics || {};
  const headcount = pmo.headcount || {
    total: 0,
    active_today: 0,
    fte: 0,
    contractor: 0,
    utilization_rate: 0,
    roles: [],
    vendors: []
  };

  const budget = pmo.budget || {
    total_planned: 0,
    total_actual: 0,
    remaining: 0,
    burn_percentage: 0,
    variance: 0,
    variance_status: 'None',
    monthly_run_rate: 0,
    cpi: 0
  };

  const timeline = pmo.timeline || {
    target_completion_date: 'TBD',
    days_remaining: 0,
    schedule_status: 'Pending',
    spi: 0,
    current_phase: 'None',
    phases: []
  };

  const tasks = pmo.tasks || {
    total: 0,
    completed: 0,
    in_progress: 0,
    under_review: 0,
    blocked: 0,
    completion_rate: 0,
    breakdown: [],
    items: []
  };

  const taskItems = tasks.items || [];

  const getPhaseDeliverables = (phase) => {
    return phase?.deliverables || [];
  };

  const governance = pmo.governance || {
    vendor_sla_adherence: 0,
    compliance_audit_score: 0,
    open_escalations: escalations.length || 0,
    gate_clearance_status: 'Pending'
  };

  // Real-time project risks calibrated for active project workspace
  const projectRisks = data?.project_risks || data?.recent_risks || (Array.isArray(risks) ? risks : []);
  const totalProjectRisks = data?.total_project_risks !== undefined ? data.total_project_risks : projectRisks.length;

  // Format currency helpers
  const fmtMoney = (val) => {
    if (val === undefined || val === null) return '$0';
    const num = Math.abs(Number(val));
    if (num >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `$${Math.round(val / 1000)}K`;
    return `$${Number(val).toLocaleString()}`;
  };

  // Burndown chart data derivation
  const chartData = data?.burndown || [];

  const isDataEmpty = !data || Object.keys(data).length === 0 || (!data.pmo_metrics && !data.financials && (!data.burndown || data.burndown.length === 0));

  if (isDataEmpty) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 mt-4 rounded-2xl theme-card border border-white/10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-[#FF5A14]">
          <FolderKanban size={32} />
        </div>
        <h3 className="text-xl font-black theme-heading mb-2">No Project Data Found</h3>
        <p className="text-sm theme-muted max-w-md mx-auto mb-6">
          The dashboard requires project data to display insights. Please import a Statement of Work (SOW) or Project Charter document to dynamically generate the dashboard metrics.
        </p>
        <button 
          onClick={() => {
            if (fileInputRef && fileInputRef.current) {
              fileInputRef.current.click();
            } else {
              const el = document.getElementById('upload-doc-btn');
              if (el) el.click();
            }
          }}
          className="px-5 py-2.5 rounded-xl bg-[#FF5A14] text-white font-bold hover:bg-[#FF7A45] transition-colors flex items-center gap-2 shadow-lg shadow-[#FF5A14]/20 mx-auto">
          <FileText size={18} />
          Import Project Document
        </button>
      </div>
    );
  }
  // Ensure escalations stream is strictly scoped to the active project or portfolio
  const isAllProjects = false;
  const activePid = activeProject?.numeric_id || activeProject?.id;
  const projectEscalations = escalations.filter(esc => {
    if (isAllProjects || scopeMode === 'portfolio') return true;
    if (esc.project_id === undefined || esc.project_id === null) return true;
    return String(esc.project_id) === String(activePid) || String(esc.project_id) === String(activeProject?.jira_key);
  });

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
                {activeProject ? `${activeProject.name} Workspace` : title}
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

        <div className="flex items-center gap-2 self-start md:self-auto">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        
        {/* PILLAR 1: TEAM & CONTRIBUTORS ("koto jon kaj korche") */}
        <div 
          onClick={() => {
            const activePid = activeProject?.numeric_id || activeProject?.id || '1';
            navigate(`/project/${activePid}?tab=team`);
          }}
          className="p-5 rounded-2xl theme-card border border-white/10 hover:border-[#FF5A14]/60 hover:shadow-[0_0_25px_rgba(255,90,20,0.15)] transition-all group relative overflow-hidden cursor-pointer"
          title="Click to open Level 4 Drilldown: Team & Contributors role-wise headcount distribution"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold theme-muted uppercase tracking-wider">
              Team & Contributors
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[#FF5A14] font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                Level 4 Drilldown <ArrowUpRight size={12} />
              </span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 group-hover:scale-110 transition-transform">
                <Users size={18} />
              </div>
            </div>
          </div>

          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl sm:text-3xl font-black theme-heading group-hover:text-[#FF7A45] transition-colors">
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
        <div 
          onClick={() => {
            const activePid = activeProject?.numeric_id || activeProject?.id || '1';
            navigate(`/project/${activePid}?tab=budget`);
          }}
          className="p-5 rounded-2xl theme-card border border-white/10 hover:border-[#FF5A14]/60 hover:shadow-[0_0_25px_rgba(255,90,20,0.15)] transition-all group relative overflow-hidden cursor-pointer"
          title="Click to open Level 4 Drilldown: Capital burn, expenditure trajectory & financial breakdown"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold theme-muted uppercase tracking-wider">
              Total Budget & Capital
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[#FF5A14] font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                Level 4 Drilldown <ArrowUpRight size={12} />
              </span>
              <div className="p-2 rounded-xl bg-[#FF5A14]/10 text-[#FF5A14] border border-[#FF5A14]/20 group-hover:scale-110 transition-transform">
                <DollarSign size={18} />
              </div>
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
        <div 
          onClick={() => {
            const activePid = activeProject?.numeric_id || activeProject?.id || '1';
            navigate(`/project/${activePid}?tab=schedule`);
          }}
          className="p-5 rounded-2xl theme-card border border-white/10 hover:border-[#FF5A14]/60 hover:shadow-[0_0_25px_rgba(255,90,20,0.15)] transition-all group relative overflow-hidden cursor-pointer"
          title="Click to open Level 4 Drilldown: Delivery roadmaps, target dates & schedule performance"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold theme-muted uppercase tracking-wider">
              Estimated Deadline
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[#FF5A14] font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                Level 4 Drilldown <ArrowUpRight size={12} />
              </span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20 group-hover:scale-110 transition-transform">
                <Calendar size={18} />
              </div>
            </div>
          </div>

          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-lg sm:text-xl font-black theme-heading truncate group-hover:text-[#FF7A45] transition-colors" title={timeline.target_completion_date}>
              {timeline.target_completion_date}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs font-semibold mb-3">
            <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-400 font-mono text-[11px]">
              {timeline.days_remaining > 0 ? `${timeline.days_remaining} Days Remaining` : 'Timeline Pending'}
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
        <div 
          onClick={() => {
            const activePid = activeProject?.numeric_id || activeProject?.id || '1';
            navigate(`/project/${activePid}?tab=governance`);
          }}
          className="p-5 rounded-2xl theme-card border border-white/10 hover:border-[#FF5A14]/60 hover:shadow-[0_0_25px_rgba(255,90,20,0.15)] transition-all group relative overflow-hidden cursor-pointer"
          title="Click to open Level 4 Drilldown: Vendor SLA adherence, compliance audit scores & gates"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold theme-muted uppercase tracking-wider">
              Vendor SLA & Governance
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[#FF5A14] font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                Level 4 Drilldown <ArrowUpRight size={12} />
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                <ShieldCheck size={18} />
              </div>
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
            Audit Score: <strong className="text-emerald-400 font-bold">{governance.compliance_audit_score}%</strong> • {projectEscalations.length} Active Escalations
          </p>

          {/* Gate status badge */}
          <div className="pt-2 border-t theme-border flex items-center justify-between text-[11px]">
            <span className="theme-muted font-medium">Compliance Gate:</span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-500 font-mono font-bold">
              {governance.gate_clearance_status}
            </span>
          </div>
        </div>

        {/* PILLAR 5: PROGRAM RISKS & THREATS */}
        <div 
          onClick={() => {
            const activePid = activeProject?.numeric_id || activeProject?.id || '1';
            navigate(`/project/${activePid}?tab=threats`);
          }}
          className="p-5 rounded-2xl theme-card border border-red-500/10 hover:border-red-500/50 hover:shadow-[0_0_25px_rgba(239,68,68,0.15)] transition-all group relative overflow-hidden cursor-pointer"
          title="Click to open Level 4 Drilldown: Program Issues & Threat Register"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold theme-muted uppercase tracking-wider">
              Program Risks & Threats
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-red-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                Level 4 Drilldown <ArrowUpRight size={12} />
              </span>
              <div className="p-2 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 group-hover:scale-110 transition-transform">
                <AlertTriangle size={18} />
              </div>
            </div>
          </div>

          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl sm:text-3xl font-black text-red-500">
              {projectRisks?.length || 0}
            </span>
            <span className="text-xs font-mono font-bold text-slate-400">
              Active Risks
            </span>
          </div>

          <p className="text-xs theme-muted font-medium mb-3">
            Critical/High: <strong className="text-red-400 font-bold">{projectRisks?.filter(r => r.severity === 'Critical' || r.severity === 'High').length ?? 0}</strong> • {escalations.length} Escalations
          </p>

          <div className="pt-2 border-t theme-border flex items-center justify-between text-[11px]">
            <span className="theme-muted font-medium">Risk Status:</span>
            <span className="font-bold text-red-500">
              {(projectRisks?.length ?? 0) > 0 ? 'Action Required' : 'All Clear'}
            </span>
          </div>
        </div>

      </div>

      {/* GRAPHICAL FORMAT STATUS SECTION ("graphical format status") */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* CHART 1: TASK & DELIVERABLES STATUS BREAKDOWN (DONUT PIE CHART) */}
        <div 
          onClick={() => {
            const activePid = activeProject?.numeric_id || activeProject?.id || '1';
            navigate(`/project/${activePid}?tab=schedule`);
          }}
          className="lg:col-span-4 p-6 rounded-2xl theme-card border border-white/10 flex flex-col justify-between hover:border-[#FF5A14]/60 hover:shadow-[0_0_25px_rgba(255,90,20,0.15)] transition-all cursor-pointer group relative"
          title="Click to open Level 4 Drilldown: Task & Deliverables Schedule"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 group-hover:bg-[#FF5A14]/10 group-hover:text-[#FF5A14] group-hover:border-[#FF5A14]/20 transition-colors">
                  <PieChartIcon size={16} />
                </div>
                <h4 className="text-sm font-bold theme-heading group-hover:text-[#FF7A45] transition-colors">
                  Task & Deliverables Status
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-[#FF5A14] font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                  Level 4 Drilldown <ArrowUpRight size={12} />
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                  {tasks.completion_rate}% Done
                </span>
              </div>
            </div>
            <p className="text-xs theme-muted mb-4">
              Real-time delivery progress across active workstreams and vendor deliverables.
            </p>
          </div>

          {/* Donut Chart Container */}
          {tasks.total === 0 ? (
            <div 
              onClick={(e) => { 
                e.stopPropagation();
                const activePid = activeProject?.numeric_id || activeProject?.id || '1';
                navigate(`/project/${activePid}?tab=schedule`);
              }}
              className="relative h-56 w-full flex flex-col items-center justify-center text-center p-4 cursor-pointer group hover:bg-white/5 rounded-2xl transition-all"
            >
              <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <PieChartIcon size={24} className="theme-muted opacity-40 group-hover:text-[#FF5A14]" />
              </div>
              <span className="text-xl font-black theme-heading">0 Tasks Logged</span>
              <p className="text-xs theme-muted mt-1 max-w-[220px]">
                No workstream tasks or deliverables logged yet. Ingest documents or connect Jira to track progress.
              </p>
              <span className="text-[11px] font-bold text-[#FF5A14] mt-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                View Team & Tasks <ArrowUpRight size={12} />
              </span>
            </div>
          ) : (
            <div 
              onClick={(e) => { 
                e.stopPropagation();
                setTaskFilter('ALL');
                setActiveDrilldown('tasks');
              }}
              className="relative h-56 w-full flex items-center justify-center cursor-pointer group"
              title="Click to open Level 4 Drilldown: Task & Deliverables Status"
            >
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
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none group-hover:scale-105 transition-transform">
                <span className="text-2xl font-black theme-heading group-hover:text-[#FF7A45] transition-colors">{tasks.total}</span>
                <span className="text-[10px] uppercase font-bold theme-muted tracking-wider">Total Tasks</span>
                <span className="text-[9px] font-mono text-[#FF5A14] font-bold opacity-0 group-hover:opacity-100 transition-opacity">Drill down →</span>
              </div>
            </div>
          )}

          {/* Interactive Legend Breakdown */}
          <div className="grid grid-cols-2 gap-2 pt-4 border-t theme-border">
            {tasks.breakdown.map((item, idx) => (
              <button 
                key={idx} 
                onClick={(e) => {
                  e.stopPropagation();
                  setTaskFilter(item.name);
                  setActiveDrilldown('tasks');
                }}
                className="flex items-center justify-between p-2 rounded-xl theme-subtle text-xs hover:border-[#FF5A14]/50 hover:bg-[#FF5A14]/10 transition-all cursor-pointer border border-transparent text-left group"
                title={`Drill down into ${item.name} deliverables`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></span>
                  <span className="font-medium theme-heading truncate text-[11px] group-hover:text-[#FF7A45]">{item.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-mono font-bold text-[11px] ml-1">{item.count}</span>
                  <ArrowUpRight size={10} className="text-[#FF5A14] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* CHART 2: BUDGET BURN & MILESTONE EXPENDITURE (AREA CHART) */}
        <div className="lg:col-span-8 p-6 rounded-2xl theme-card border border-white/10 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#FF5A14]/10 text-[#FF5A14] border border-[#FF5A14]/20">
                <BarChart3 size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 
                    onClick={() => {
                      const activePid = activeProject?.numeric_id || activeProject?.id || '1';
                      navigate(`/project/${activePid}?tab=budget`);
                    }}
                    className="text-sm font-bold theme-heading cursor-pointer hover:text-[#FF7A45] transition-colors flex items-center gap-1.5"
                    title="Click to open Level 4 Drilldown: Budget & Capital Breakdown"
                  >
                    <span>Milestone Budget Burndown & Spend Curve(Planned vs. Spend vs. Work Done)</span>
                    <ArrowUpRight size={13} className="text-[#FF5A14]" />
                  </h4>
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 border ${
                      (Number(budget.cpi) >= 1.0 || budget.cpi === undefined) 
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                        : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        (Number(budget.cpi) >= 1.0 || budget.cpi === undefined) ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400 animate-pulse'
                      }`}></span>
                      CPI {budget.cpi || '1.08'} {(Number(budget.cpi) >= 1.0 || budget.cpi === undefined) ? 'Favorable' : 'Deficit'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 border ${
                      (Number(budget.spi || timeline.spi || 1.0) >= 1.0) 
                        ? 'bg-sky-500/15 text-sky-400 border-sky-500/30' 
                        : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${(Number(budget.spi || timeline.spi || 1.0) >= 1.0) ? 'bg-sky-400' : 'bg-amber-400'}`}></span>
                      SPI {budget.spi || timeline.spi || '1.00'} {(Number(budget.spi || timeline.spi || 1.0) >= 1.0) ? 'On Track' : 'Impeded'}
                    </span>
                  </div>
                </div>
                <p className="text-xs theme-muted">
                  Planned baseline allocation vs actual cumulative expenditure vs completed deliverables
                </p>
              </div>
            </div>
            {/* Interactive 3-Line Legend */}
            <div className="flex items-center gap-3 text-xs font-semibold flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                <span className="theme-muted text-[11px]">Planned Target</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF5A14]"></span>
                <span className="text-[#FF5A14] font-bold text-[11px]">Actual Spend</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
                <span className="text-emerald-400 font-bold text-[11px]">Work Completed</span>
              </div>
            </div>
          </div>

          {/* Area Chart Container */}
          <div className="h-64 w-full mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 15, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="pmoActualGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF5A14" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#FF5A14" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="pmoPlannedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#64748B" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#64748B" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="pmoEarnedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255, 255, 255, 0.07)' : '#E2E8F0'} />
                <XAxis dataKey="sprint" stroke={isDark ? '#94A3B8' : '#64748B'} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke={isDark ? '#94A3B8' : '#64748B'} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}k`} />
                <RechartsTooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    const pl = payload.find(p => p.dataKey === 'planned')?.value;
                    const ac = payload.find(p => p.dataKey === 'actual')?.value;
                    const ev = payload.find(p => p.dataKey === 'earned')?.value;
                    const diff = (ev !== undefined && ev !== null && ac !== undefined && ac !== null) ? (ev - ac) : null;
                    return (
                      <div className={`p-3 rounded-xl border shadow-xl text-xs space-y-1.5 ${isDark ? 'bg-[#141A28] border-white/15 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                        <div className="font-bold border-b border-white/10 pb-1 flex items-center justify-between gap-4">
                          <span>{label}</span>
                          {ac !== null && ac !== undefined ? (
                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${diff >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                              {diff >= 0 ? `+$${diff}k Value Surplus (Ahead)` : `-$${Math.abs(diff)}k Deficit (Behind)`}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-mono">Future Milestone</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                            <span className="w-2 h-2 rounded-full bg-slate-400"></span> Planned Target:
                          </span>
                          <span className="font-mono font-bold">${pl}k</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5 text-[#FF5A14] text-[11px]">
                            <span className="w-2 h-2 rounded-full bg-[#FF5A14]"></span> Actual Spend:
                          </span>
                          <span className="font-mono font-bold text-[#FF5A14]">{ac !== null && ac !== undefined ? `$${ac}k` : 'Not Reached'}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
                            <span className="w-2 h-2 rounded-full bg-[#10B981]"></span> Work Completed:
                          </span>
                          <span className="font-mono font-bold text-emerald-400">{ev !== null && ev !== undefined ? `$${ev}k` : 'Not Reached'}</span>
                        </div>
                      </div>
                    );
                  }}
                />
                {/* Vertical "Today / Current Sprint" Marker */}
                <ReferenceLine
                  x={chartData.find(c => c.is_current)?.sprint || data?.active_sprint || budget?.active_sprint || 'Sprint 3'}
                  stroke="#FF5A14"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  label={{
                    value: '● TODAY (CURRENT SPRINT)',
                    position: 'top',
                    fill: '#FF7A45',
                    fontSize: 9,
                    fontWeight: 800,
                    offset: 8
                  }}
                />
                <Area type="monotone" dataKey="planned" name="Planned Target" stroke={isDark ? '#94A3B8' : '#64748B'} strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#pmoPlannedGradient)" />
                <Area type="monotone" dataKey="actual" name="Actual Spend" stroke="#FF5A14" strokeWidth={3} fillOpacity={1} fill="url(#pmoActualGradient)" />
                <Area type="monotone" dataKey="earned" name="Work Completed" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#pmoEarnedGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 mt-2 border-t theme-border text-center">
            <div>
              <span className="text-[10px] theme-muted uppercase font-bold block">Monthly Run-Rate</span>
              <span className="font-mono font-bold text-xs theme-heading">{fmtMoney(budget.monthly_run_rate)}/mo</span>
            </div>
            <div>
              <span className="text-[10px] theme-muted uppercase font-bold block">Cost Perf. (CPI)</span>
              <span className={`font-mono font-bold text-xs ${Number(budget.cpi) >= 1.0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {budget.cpi} {Number(budget.cpi) >= 1.0 ? 'Favorable' : 'Critical'}
              </span>
            </div>
            <div>
              <span className="text-[10px] theme-muted uppercase font-bold block">Schedule Perf. (SPI)</span>
              <span className={`font-mono font-bold text-xs ${Number(budget.spi || timeline.spi || 1.0) >= 1.0 ? 'text-sky-400' : 'text-amber-400'}`}>
                {budget.spi || timeline.spi || '1.00'} {Number(budget.spi || timeline.spi || 1.0) >= 1.0 ? 'On Track' : 'Delayed'}
              </span>
            </div>
            <div>
              <span className="text-[10px] theme-muted uppercase font-bold block">Remaining Capital</span>
              <span className="font-mono font-bold text-xs text-[#FF5A14]">{fmtMoney(budget.remaining)}</span>
            </div>
          </div>
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
              {projectEscalations.length} Flagged
            </span>
          </div>
          <p className="text-xs theme-muted mb-4">
            Real-time supplier compliance breaches, SLA thresholds, and gate approval requests.
          </p>

          {projectEscalations.length === 0 ? (
            <div className="py-8 text-center">
              <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2" />
              <p className="text-xs theme-muted font-medium">
                All active vendor workstreams are currently compliant with baseline SOWs.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
              {projectEscalations.map((esc, idx) => {
                const escId = esc.esc_id || esc.id || `ESC-${String(idx + 1).padStart(3, '0')}`;
                const isRisk = (escId && escId.startsWith('R-')) || (esc.action && (esc.action.includes('Threat') || esc.action.includes('Risk') || esc.action.includes('Blocker')));
                
                let searchId = escId;
                if (esc.action) {
                  const rMatch = esc.action.match(/(R-\d+)/);
                  if (rMatch) {
                    searchId = rMatch[1];
                  }
                }
                
                const targetUrl = isRisk ? `/risks?search=${searchId}` : `/guardrails#${escId}`;
                const timeDisplay = esc.created_at ? new Date(esc.created_at).toLocaleString() : (esc.time || 'Recent');
                return (
                  <div 
                    key={idx} 
                    onClick={() => navigate(targetUrl)}
                    className="p-3 rounded-xl theme-subtle border theme-border hover:border-[#FF5A14]/60 hover:bg-[#FF5A14]/5 transition-all flex justify-between items-center text-xs cursor-pointer group"
                    title={`Click to drill down into ${escId} in ${isRisk ? 'Risk Register' : 'Guardrails'}`}
                  >
                    <div className="flex items-center gap-2.5 truncate min-w-0 pr-2">
                      <span className="font-bold text-[#FF5A14] font-mono group-hover:underline flex-shrink-0">{escId}</span>
                      {(isAllProjects || scopeMode === 'portfolio') && esc.project_key && (
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#FF5A14]/15 text-[#FF7A45] border border-[#FF5A14]/30 flex-shrink-0 font-bold">
                          [{esc.project_key}]
                        </span>
                      )}
                      <span className="font-medium theme-heading truncate group-hover:text-[#FF7A45]">{esc.action || esc.title || 'SLA Threshold Warning'}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span 
                        className="text-[10px] theme-muted font-mono px-2 py-0.5 rounded theme-subtle border theme-border flex items-center gap-1 whitespace-nowrap"
                        title={esc.created_at ? `Created: ${new Date(esc.created_at).toLocaleString()}` : ''}
                      >
                        <Clock size={10} className="text-[#FF5A14]" />
                        {timeDisplay}
                      </span>
                      <span className="text-[10px] font-bold text-[#FF5A14] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                        Investigate <ArrowRight size={11} />
                      </span>
                    </div>
                  </div>
                );
              })}
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

      {/* ========================================================================= */}
      {/* INTERACTIVE EXECUTIVE DRILLDOWN MODALS */}
      {/* ========================================================================= */}
      {activeDrilldown && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setActiveDrilldown(null)}
        >
          <div 
            className="theme-card border border-white/10 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b theme-border">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#FF5A14]/15 text-[#FF5A14] border border-[#FF5A14]/30">
                  {activeDrilldown === 'team' && <Users size={20} />}
                  {activeDrilldown === 'budget' && <DollarSign size={20} />}
                  {activeDrilldown === 'deadline' && <Calendar size={20} />}
                  {activeDrilldown === 'governance' && <ShieldCheck size={20} />}
                  {activeDrilldown === 'tasks' && <PieChartIcon size={20} />}
                  {activeDrilldown === 'phase' && <Layers size={20} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold theme-heading">
                      {activeDrilldown === 'team' && 'Executive Resource & Contributor Allocation'}
                      {activeDrilldown === 'budget' && 'Program Capital Burn & Expenditure Trajectory'}
                      {activeDrilldown === 'deadline' && 'Delivery Schedule & Milestone Roadmaps'}
                      {activeDrilldown === 'governance' && 'Vendor SLA Governance & Compliance Gate'}
                      {activeDrilldown === 'tasks' && 'Workstream Deliverables & Backlog Drilldown'}
                      {activeDrilldown === 'phase' && `Milestone Phase Scope: ${selectedPhase?.id || 'PH-01'}`}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FF5A14]/15 text-[#FF5A14] border border-[#FF5A14]/30">
                      {activeProject?.jira_key || 'ACTIVE'}
                    </span>
                  </div>
                  <p className="text-xs theme-muted mt-0.5">
                    {activeDrilldown === 'team' && 'Headcount distribution, engineering disciplines, and vendor partner allocations'}
                    {activeDrilldown === 'budget' && 'Planned capital baseline vs actual cumulative spend and burn rate'}
                    {activeDrilldown === 'deadline' && 'Target go-live dates, schedule performance index (SPI), and critical path phases'}
                    {activeDrilldown === 'governance' && 'Vendor SLA adherence, compliance audit scores, and autonomous gate clearances'}
                    {activeDrilldown === 'tasks' && 'Real-time deliverable tracking across engineering pods and vendor deliverables'}
                    {activeDrilldown === 'phase' && `${selectedPhase?.name || 'Milestone Phase Delivery'}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveDrilldown(null)}
                className="p-1.5 rounded-xl theme-subtle border theme-border hover:text-[#FF5A14] transition-colors cursor-pointer"
                title="Close Drilldown"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body: Team & Resource Allocation */}
            {activeDrilldown === 'team' && (
              <div className="space-y-5 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-xl theme-subtle border theme-border">
                    <span className="theme-muted block text-[10px] uppercase font-bold">Total Staff</span>
                    <span className="text-xl font-black theme-heading font-mono">{headcount.total}</span>
                  </div>
                  <div className="p-3 rounded-xl theme-subtle border theme-border">
                    <span className="theme-muted block text-[10px] uppercase font-bold">Active Today</span>
                    <span className="text-xl font-black text-emerald-500 font-mono">{headcount.active_today}</span>
                  </div>
                  <div className="p-3 rounded-xl theme-subtle border theme-border">
                    <span className="theme-muted block text-[10px] uppercase font-bold">Internal FTEs</span>
                    <span className="text-xl font-black text-blue-400 font-mono">{headcount.fte}</span>
                  </div>
                  <div className="p-3 rounded-xl theme-subtle border theme-border">
                    <span className="theme-muted block text-[10px] uppercase font-bold">Contractors</span>
                    <span className="text-xl font-black text-[#FF5A14] font-mono">{headcount.contractor}</span>
                  </div>
                </div>

                {headcount.total === 0 ? (
                  <div className="py-8 text-center theme-subtle border theme-border rounded-xl p-4">
                    <Users size={32} className="text-[#FF5A14]/40 mx-auto mb-2" />
                    <div className="font-bold theme-heading text-sm">No Resources Allocated Yet</div>
                    <p className="text-xs theme-muted mt-1 max-w-sm mx-auto">
                      Ingest project SOW contracts or team rosters in the Ingestion Portal to track engineering disciplines and vendor partners.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Engineering Disciplines */}
                    <div>
                      <h4 className="font-bold theme-heading uppercase tracking-wider text-[11px] mb-2.5 flex items-center gap-1.5">
                        <Briefcase size={14} className="text-[#FF5A14]" />
                        Resource Allocation by Discipline
                      </h4>
                      <div className="space-y-2.5">
                        {headcount.roles.map((r, idx) => (
                          <div key={idx} className="p-2.5 rounded-xl theme-subtle border theme-border">
                            <div className="flex justify-between items-center text-xs mb-1">
                              <span className="font-semibold theme-heading">{r.role}</span>
                              <span className="font-mono font-bold">{r.count} Staff ({r.allocation_pct}%)</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${r.allocation_pct}%`, backgroundColor: r.color }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Vendor Partners */}
                    <div>
                      <h4 className="font-bold theme-heading uppercase tracking-wider text-[11px] mb-2.5 flex items-center gap-1.5">
                        <Building2 size={14} className="text-[#FF5A14]" />
                        Vendor Partner Pods
                      </h4>
                      <div className="space-y-2">
                        {headcount.vendors.map((v, idx) => (
                          <div key={idx} className="p-3 rounded-xl theme-subtle border theme-border flex items-center justify-between">
                            <div>
                              <div className="font-bold theme-heading">{v.name}</div>
                              <span className="text-[11px] theme-muted">{v.type} • Contract Share: {v.share}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-mono font-bold text-sm text-[#FF5A14]">{v.headcount} Staff</span>
                              <span className="block text-[10px] font-mono text-emerald-500 font-bold">SLA: {v.sla}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div className="pt-3 border-t theme-border flex items-center justify-between">
                  <button
                    onClick={() => {
                      setActiveTab('resources');
                      setActiveDrilldown(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#FF5A14]/10 text-[#FF5A14] hover:bg-[#FF5A14]/20 font-bold transition-colors cursor-pointer"
                  >
                    View Resource Tab on Dashboard
                  </button>
                  <Link
                    to="/projects"
                    onClick={() => setActiveDrilldown(null)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white font-bold transition-all shadow-sm hover:brightness-110 flex items-center gap-1"
                  >
                    <span>Manage in Projects Hub</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            )}

            {/* Modal Body: Budget & Capital */}
            {activeDrilldown === 'budget' && (
              <div className="space-y-5 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-xl theme-subtle border theme-border">
                    <span className="theme-muted block text-[10px] uppercase font-bold">Planned Baseline</span>
                    <span className="text-xl font-black theme-heading font-mono">{fmtMoney(budget.total_planned)}</span>
                  </div>
                  <div className="p-3 rounded-xl theme-subtle border theme-border">
                    <span className="theme-muted block text-[10px] uppercase font-bold">Actual Spend</span>
                    <span className="text-xl font-black text-[#FF5A14] font-mono">{fmtMoney(budget.total_actual)}</span>
                  </div>
                  <div className="p-3 rounded-xl theme-subtle border theme-border">
                    <span className="theme-muted block text-[10px] uppercase font-bold">Remaining</span>
                    <span className="text-xl font-black text-emerald-500 font-mono">{fmtMoney(budget.remaining)}</span>
                  </div>
                  <div className="p-3 rounded-xl theme-subtle border theme-border">
                    <span className="theme-muted block text-[10px] uppercase font-bold">Cost Variance</span>
                    <span className={`text-xl font-black font-mono ${budget.variance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {budget.variance >= 0 ? `+${fmtMoney(budget.variance)}` : `-${fmtMoney(Math.abs(budget.variance))}`}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl theme-subtle border theme-border space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold theme-heading text-xs">Expenditure Velocity & Metrics</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${budget.variance >= 0 ? 'bg-emerald-500/15 text-emerald-500' : 'bg-red-500/15 text-red-500'}`}>
                      {budget.variance_status} Trajectory
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="theme-muted text-[11px]">Monthly Burn Rate:</span>
                      <strong className="block theme-heading font-mono text-sm mt-0.5">{fmtMoney(budget.monthly_run_rate)} / month</strong>
                    </div>
                    <div>
                      <span className="theme-muted text-[11px]">Cost Performance Index (CPI):</span>
                      <strong className="block text-emerald-500 font-mono text-sm mt-0.5">{budget.cpi} Favorable</strong>
                    </div>
                  </div>
                  <div className="pt-2">
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="theme-muted">Capital Consumed:</span>
                      <span className="font-mono font-bold text-[#FF5A14]">{budget.burn_percentage}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#FF5A14] to-[#FF7A45]" style={{ width: `${budget.burn_percentage}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t theme-border flex items-center justify-between">
                  <button
                    onClick={() => setActiveDrilldown(null)}
                    className="px-4 py-2 rounded-xl theme-card border theme-border font-bold transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  <Link
                    to={activeProject?.id ? `/project/${activeProject.id}` : '/projects'}
                    onClick={() => setActiveDrilldown(null)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white font-bold transition-all shadow-sm hover:brightness-110 flex items-center gap-1"
                  >
                    <span>Open Full Project Financials</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            )}

            {/* Modal Body: Deadline & Schedule */}
            {activeDrilldown === 'deadline' && (
              <div className="space-y-5 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-xl theme-subtle border theme-border">
                    <span className="theme-muted block text-[10px] uppercase font-bold">Target Date</span>
                    <span className="text-xs font-black theme-heading font-mono block mt-1 truncate">{timeline.target_completion_date}</span>
                  </div>
                  <div className="p-3 rounded-xl theme-subtle border theme-border">
                    <span className="theme-muted block text-[10px] uppercase font-bold">Days Left</span>
                    <span className="text-xl font-black text-purple-400 font-mono">{timeline.days_remaining}d</span>
                  </div>
                  <div className="p-3 rounded-xl theme-subtle border theme-border">
                    <span className="theme-muted block text-[10px] uppercase font-bold">Schedule SPI</span>
                    <span className="text-xl font-black text-emerald-500 font-mono">{timeline.spi}</span>
                  </div>
                  <div className="p-3 rounded-xl theme-subtle border theme-border">
                    <span className="theme-muted block text-[10px] uppercase font-bold">Status</span>
                    <span className="text-xs font-bold text-emerald-400 block mt-1 truncate">{timeline.schedule_status}</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold theme-heading uppercase tracking-wider text-[11px] mb-2.5 flex items-center gap-1.5">
                    <Layers size={14} className="text-[#FF5A14]" />
                    Delivery Milestone Sequence
                  </h4>
                  <div className="space-y-2">
                    {timeline.phases.map((ph, idx) => (
                      <div 
                        key={idx}
                        onClick={() => {
                          setSelectedPhase(ph);
                          setActiveDrilldown('phase');
                        }}
                        className="p-3 rounded-xl theme-subtle border theme-border hover:border-[#FF5A14]/60 transition-all flex items-center justify-between cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-[#FF5A14]/15 text-[#FF5A14] font-mono font-bold flex items-center justify-center text-[10px]">
                            {ph.id}
                          </span>
                          <div>
                            <div className="font-bold theme-heading group-hover:text-[#FF7A45] transition-colors">{ph.name}</div>
                            <span className="text-[11px] theme-muted">Target: {ph.target_date}</span>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <span className="font-mono font-bold text-xs">{ph.completion_pct}%</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            ph.status === 'Completed' ? 'bg-emerald-500/15 text-emerald-500' :
                            ph.status === 'In Progress' ? 'bg-blue-500/15 text-blue-400' : 'bg-slate-500/15 text-slate-400'
                          }`}>
                            {ph.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t theme-border flex items-center justify-between">
                  <button
                    onClick={() => setActiveDrilldown(null)}
                    className="px-4 py-2 rounded-xl theme-card border theme-border font-bold transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('overview');
                      setActiveDrilldown(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white font-bold transition-all shadow-sm hover:brightness-110 flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Roadmaps on Dashboard</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            )}

            {/* Modal Body: Governance */}
            {activeDrilldown === 'governance' && (
              <div className="space-y-5 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-xl theme-subtle border theme-border">
                    <span className="theme-muted block text-[10px] uppercase font-bold">SLA Adherence</span>
                    <span className="text-xl font-black text-emerald-500 font-mono">{governance.vendor_sla_adherence}%</span>
                  </div>
                  <div className="p-3 rounded-xl theme-subtle border theme-border">
                    <span className="theme-muted block text-[10px] uppercase font-bold">Audit Score</span>
                    <span className="text-xl font-black text-emerald-400 font-mono">{governance.compliance_audit_score}%</span>
                  </div>
                  <div className="p-3 rounded-xl theme-subtle border theme-border">
                    <span className="theme-muted block text-[10px] uppercase font-bold">Escalations</span>
                    <span className="text-xl font-black text-amber-500 font-mono">{governance.open_escalations}</span>
                  </div>
                  <div className="p-3 rounded-xl theme-subtle border theme-border">
                    <span className="theme-muted block text-[10px] uppercase font-bold">Gate Status</span>
                    <span className="text-xs font-bold text-emerald-500 block mt-1 truncate">{governance.gate_clearance_status}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl theme-subtle border theme-border space-y-2.5">
                  <h4 className="font-bold theme-heading text-xs">Autonomous Compliance Guardrails</h4>
                  <p className="text-xs theme-muted leading-relaxed">
                    The platform continuously cross-checks active vendor rate cards, SOW deliverables, Jira sprint velocities, and AWS/Azure telemetry to enforce gate clearances autonomously.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                    <div className="p-2.5 rounded-lg theme-card border theme-border flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      <span>Contractual SOW Baseline Verified</span>
                    </div>
                    <div className="p-2.5 rounded-lg theme-card border theme-border flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      <span>Role & Rate Card Guardrails Enforced</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t theme-border flex items-center justify-between">
                  <button
                    onClick={() => setActiveDrilldown(null)}
                    className="px-4 py-2 rounded-xl theme-card border theme-border font-bold transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  <Link
                    to="/guardrails"
                    onClick={() => setActiveDrilldown(null)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white font-bold transition-all shadow-sm hover:brightness-110 flex items-center gap-1"
                  >
                    <span>Manage in Guardrails & Audits</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            )}

            {/* Modal Body: Tasks & Deliverables Drilldown */}
            {activeDrilldown === 'tasks' && (
              <div className="space-y-4 text-xs">
                {/* Filter Pills */}
                <div className="flex flex-wrap gap-1.5 pb-2 border-b theme-border">
                  <button
                    onClick={() => setTaskFilter('ALL')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      taskFilter === 'ALL'
                        ? 'bg-[#FF5A14] text-white shadow-sm'
                        : 'theme-subtle text-slate-400 hover:text-white border theme-border'
                    }`}
                  >
                    All Deliverables ({tasks.total})
                  </button>
                  {tasks.breakdown.map((b, idx) => (
                    <button
                      key={idx}
                      onClick={() => setTaskFilter(b.name)}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        taskFilter === b.name
                          ? 'bg-[#FF5A14] text-white shadow-sm'
                          : 'theme-subtle text-slate-400 hover:text-white border theme-border'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: b.color }}></span>
                      <span>{b.name} ({b.count})</span>
                    </button>
                  ))}
                </div>

                {/* Task List */}
                {taskItems.length === 0 ? (
                  <div className="py-10 text-center theme-subtle border theme-border rounded-xl p-4">
                    <PieChartIcon size={36} className="text-[#FF5A14]/40 mx-auto mb-2" />
                    <div className="font-bold theme-heading text-sm">No Workstream Deliverables Found</div>
                    <p className="text-xs theme-muted mt-1 max-w-sm mx-auto">
                      Ingest project SOW contracts or connect Jira in Settings to populate live deliverable cards.
                    </p>
                    <Link
                      to="/ingestion"
                      onClick={() => setActiveDrilldown(null)}
                      className="mt-4 inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white font-bold text-xs"
                    >
                      <span>Go to Ingestion Portal</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                    {taskItems
                      .filter(t => {
                        if (taskFilter === 'ALL') return true;
                        if (taskFilter === 'Blocked / Impeded') return t.status.includes('Blocked');
                        return t.status === taskFilter;
                      })
                      .map((t, idx) => {
                        const isBlocked = t.status.includes('Blocked');
                        return (
                          <div 
                            key={idx}
                            className={`p-3.5 rounded-xl border transition-all ${
                              isBlocked 
                                ? 'bg-red-500/5 border-red-500/30' 
                                : 'theme-subtle border theme-border'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-mono font-bold text-[#FF5A14]">{t.id}</span>
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 theme-muted font-semibold text-[10px]">
                                    {t.workstream}
                                  </span>
                                </div>
                                <h5 className="font-bold theme-heading text-xs">{t.title}</h5>
                                <div className="flex items-center gap-3 text-[11px] theme-muted mt-1">
                                  <span>Owner: <strong className="theme-heading">{t.owner}</strong></span>
                                  <span>Due: <strong className="theme-heading">{t.due_date}</strong></span>
                                </div>
                              </div>

                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase flex-shrink-0 ${
                                t.status === 'Completed' ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30' :
                                t.status === 'In Progress' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' :
                                t.status.includes('Review') ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30' :
                                'bg-red-500/15 text-red-500 border border-red-500/30 animate-pulse'
                              }`}>
                                {t.status}
                              </span>
                            </div>

                            {/* Blocker Alert Box & Action Button */}
                            {isBlocked && (
                              <div className="mt-3 pt-2.5 border-t border-red-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="text-[11px] text-red-400 flex items-center gap-1.5">
                                  <AlertCircle size={13} className="text-red-500 flex-shrink-0" />
                                  <span>{t.blocker_reason || 'Delivery blocked pending mitigation.'}</span>
                                </div>
                                {t.linked_risk_id && (
                                  <button
                                    onClick={() => {
                                      setActiveDrilldown(null);
                                      navigate(`/risks?search=${t.linked_risk_id}`);
                                    }}
                                    className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] transition-colors flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                                  >
                                    <span>Investigate Issue ({t.linked_risk_id})</span>
                                    <ArrowRight size={11} />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}

                <div className="pt-3 border-t theme-border flex items-center justify-between">
                  <span className="text-[11px] theme-muted">
                    Showing deliverables for {taskFilter === 'ALL' ? 'all categories' : taskFilter}
                  </span>
                  <button
                    onClick={() => setActiveDrilldown(null)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white font-bold transition-all shadow-sm hover:brightness-110 cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}

            {/* Modal Body: Milestone Phase Scope & Deliverables */}
            {activeDrilldown === 'phase' && selectedPhase && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-xl theme-subtle border theme-border">
                    <span className="theme-muted block text-[10px] uppercase font-bold">Phase Code</span>
                    <span className="text-xl font-black text-[#FF5A14] font-mono">{selectedPhase.id}</span>
                  </div>
                  <div className="p-3 rounded-xl theme-subtle border theme-border">
                    <span className="theme-muted block text-[10px] uppercase font-bold">Target Date</span>
                    <span className="text-xs font-black theme-heading font-mono block mt-1 truncate">{selectedPhase.target_date}</span>
                  </div>
                  <div className="p-3 rounded-xl theme-subtle border theme-border">
                    <span className="theme-muted block text-[10px] uppercase font-bold">Days Left</span>
                    <span className="text-xl font-black text-purple-400 font-mono">{selectedPhase.days_left}d</span>
                  </div>
                  <div className="p-3 rounded-xl theme-subtle border theme-border">
                    <span className="theme-muted block text-[10px] uppercase font-bold">Completion</span>
                    <span className="text-xl font-black text-emerald-500 font-mono">{selectedPhase.completion_pct}%</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold theme-heading uppercase tracking-wider text-[11px] mb-2.5 flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-[#FF5A14]" />
                    Contractual SOW Deliverables Checklist
                  </h4>
                  <div className="space-y-2">
                    {getPhaseDeliverables(selectedPhase).map((del, idx) => (
                      <div key={idx} className="p-3 rounded-xl theme-subtle border theme-border flex items-center justify-between">
                        <div>
                          <div className="font-bold theme-heading text-xs">{del.name}</div>
                          <span className="text-[11px] theme-muted">Assigned: {del.owner}</span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          del.status === 'Verified' ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30' :
                          del.status === 'In Progress' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' :
                          del.status === 'Blocked' ? 'bg-red-500/15 text-red-500 border border-red-500/30' :
                          'bg-slate-500/15 text-slate-400 border border-slate-500/30'
                        }`}>
                          {del.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t theme-border flex items-center justify-between">
                  <Link
                    to="/knowledge"
                    onClick={() => setActiveDrilldown(null)}
                    className="px-4 py-2 rounded-xl bg-[#FF5A14]/10 text-[#FF5A14] hover:bg-[#FF5A14]/20 font-bold transition-colors cursor-pointer"
                  >
                    Inspect SOW in Knowledge & RAG
                  </Link>
                  <button
                    onClick={() => setActiveDrilldown(null)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white font-bold transition-all shadow-sm hover:brightness-110 cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default PMOLeadDashboard;
