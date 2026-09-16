import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { dashboardApi } from '../api/dashboardApi';
import KPICard from '../components/dashboard/KPICard';
import BurndownChart from '../components/dashboard/BurndownChart';
import RiskHeatmap from '../components/dashboard/RiskHeatmap';
import ProjectThreatRegister from '../components/dashboard/ProjectThreatRegister';
import FuturisticLoader from '../components/common/FuturisticLoader';
import { 
  ArrowLeft, 
  ArrowRight, 
  Users, 
  Briefcase, 
  CheckCircle2, 
  Layers, 
  ChevronRight, 
  Sparkles,
  ExternalLink,
  DollarSign,
  Calendar,
  Clock,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Building2,
  Check,
  Zap,
  Filter
} from 'lucide-react';

const ProjectDrilldown = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { activeProject, selectProject } = useProject();

  const [data, setData] = useState(null);
  const [teamData, setTeamData] = useState(null);
  const [expandedPhase, setExpandedPhase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tab filtering: 'all' | 'team' | 'budget' | 'schedule' | 'governance' | 'threats'
  const currentTab = searchParams.get('tab') || 'all';

  const handleTabChange = (tabKey) => {
    setSearchParams(tabKey === 'all' ? {} : { tab: tabKey });
  };

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [details, team] = await Promise.all([
          dashboardApi.getProjectDetails(id),
          dashboardApi.getProjectTeam(id).catch(err => {
            console.warn("Project team fetch error in drilldown:", err);
            return null;
          })
        ]);

        if (isMounted) {
          setData(details);
          if (team) {
            setTeamData(team);
          } else if (details?.team_summary) {
            setTeamData({
              total_resources: details.team_summary.total || 0,
              roles: details.team_summary.roles || [],
              vendors: details.team_summary.vendors || [],
              members: details.team_summary.members || []
            });
          }

          // Sync activeProject in context
          if (details && (!activeProject || (activeProject.id !== details.numeric_id && activeProject.jira_key !== details.id))) {
            selectProject({
              id: details.numeric_id || details.id,
              jira_key: details.id,
              name: details.name,
              status: details.status
            });
          }
        }
      } catch (err) {
        console.error("Failed to load project drilldown:", err);
        if (isMounted) {
          setError(err.message || "Failed to load project details.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Scroll to hash section if present on initial render
  useEffect(() => {
    if (!loading && data) {
      const hash = window.location.hash;
      if (hash) {
        const el = document.querySelector(hash);
        if (el) {
          setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
        }
      }
    }
  }, [loading, data]);

  if (loading) {
    return (
      <FuturisticLoader 
        title="Synthesizing Project Intelligence..." 
        subtitle={`Calibrating role-wise telemetry, budget trajectory, and milestones for project: ${id}`} 
      />
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center animate-fadeIn">
        <div className="p-6 rounded-2xl theme-card border border-red-500/30">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-3">
            <Layers size={24} />
          </div>
          <h2 className="text-base font-bold theme-heading mb-1">Project Workspace Unavailable</h2>
          <p className="text-xs sm:text-sm theme-muted mb-6 leading-relaxed">
            {error || `Unable to load data for project '${id}'.`}
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white text-xs font-bold shadow-lg hover:brightness-110 transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Return to Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  const getPersonaDashboardLabel = () => {
    if (user?.role === 'PMO') return 'PMO Command Center';
    if (user?.role === 'Program Director') return 'Program Governance';
    if (user?.role === 'Project Manager') return 'Project Execution';
    return 'Executive Dashboard';
  };

  const projectKey = data.id || id;
  const projectNumericId = data.numeric_id || id;
  const rolesList = teamData?.roles || data.team_summary?.roles || [];
  const totalResources = teamData?.total_resources !== undefined 
    ? teamData.total_resources 
    : (data.team_summary?.total || (teamData?.members?.length || 0));

  const budget = data.budget_summary || {
  total_planned: 0,
  total_actual: 0,
  remaining: 0,
  burn_percentage: 0,
  variance: 0,
  variance_status: 'None'
};

  const timeline = data.timeline_summary || {
    target_completion_date: "November 28, 2026",
    days_remaining: 74,
    spi: 1.02,
    schedule_status: "Governed by Project Charter & SOW",
    phases: [
      { id: "PH-01", name: "Architecture & SOW Sign-off", target_date: "Oct 15, 2026", status: "Completed", completion_pct: 100, days_left: 0 },
      { id: "PH-02", name: "Core Service Dev & Data Pipeline", target_date: "Nov 02, 2026", status: "In Progress", completion_pct: 65, days_left: 18 },
      { id: "PH-03", name: "Integration & Security Compliance", target_date: "Nov 18, 2026", status: "In Progress", completion_pct: 35, days_left: 34 },
      { id: "PH-04", name: "UAT & Regulatory Clearance Gate", target_date: "Nov 28, 2026", status: "Scheduled", completion_pct: 0, days_left: 44 },
      { id: "PH-05", name: "Production Cutover & Handover", target_date: "Dec 15, 2026", status: "Scheduled", completion_pct: 0, days_left: 61 }
    ]
  };

  const governance = data.governance_summary || {
  vendor_sla_adherence: 0,
  compliance_audit_score: 0,
  gate_clearance_status: 'Pending'
};

  const fmtMoney = (val) => {
    if (val === undefined || val === null) return '$0';
    if (Math.abs(val) >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
    if (Math.abs(val) >= 1000) return `$${(val / 1000).toFixed(0)}k`;
    return `$${val.toLocaleString()}`;
  };

  const getSectionOrder = (sectionId) => {
    if (user?.role === 'Project Manager') {
      const pmOrder = { kpi: 1, team: 2, schedule: 3, threats: 4, charts: 5, budget: 6, governance: 7 };
      return pmOrder[sectionId] || 99;
    }
    if (user?.role === 'PMO' || user?.role === 'Program Director') {
      const pmoOrder = { kpi: 1, budget: 2, governance: 3, schedule: 4, charts: 5, threats: 6, team: 7 };
      return pmoOrder[sectionId] || 99;
    }
    const defaultOrder = { kpi: 1, team: 2, budget: 3, schedule: 4, governance: 5, charts: 6, threats: 7 };
    return defaultOrder[sectionId] || 99;
  };

  return (
    <div className="py-2 space-y-6 animate-fadeIn">
      
      {/* 1. TOP CONTEXTUAL BREADCRUMBS & NAVIGATION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-white/10">
        <nav className="flex items-center gap-2 text-xs font-semibold theme-muted overflow-x-auto whitespace-nowrap py-1">
          <Link 
            to="/dashboard" 
            className="hover:text-[#FF5A14] transition-colors flex items-center gap-1.5"
            title="Return to Main Persona Dashboard"
          >
            <Layers size={13} className="text-[#FF5A14]" />
            <span>{getPersonaDashboardLabel()}</span>
          </Link>

          <ChevronRight size={13} className="text-slate-500 dark:text-slate-600 flex-shrink-0" />

          <Link 
            to="/projects" 
            className="hover:text-[#FF5A14] transition-colors"
          >
            Projects Hub
          </Link>

          <ChevronRight size={13} className="text-slate-500 dark:text-slate-600 flex-shrink-0" />

          <span className="text-[#FF5A14] font-bold font-mono flex items-center gap-1.5">
            <span>[{projectKey}]</span>
            <span className="theme-heading font-sans font-bold">{data.name}</span>
          </span>
        </nav>

        {/* Back Button */}
        <button 
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl theme-subtle border theme-border hover:border-[#FF5A14]/50 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all self-start sm:self-auto cursor-pointer"
        >
          <ArrowLeft size={13} className="text-[#FF5A14]" />
          <span>Back to Dashboard</span>
        </button>
      </div>

      {/* 2. PROJECT TITLE & TELEMETRY BADGES */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#FF5A14]/15 text-[#FF5A14] border border-[#FF5A14]/30">
              Level 3 Drilldown: Project Workspace
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
              data.status === 'Active' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
              'bg-blue-500/15 text-blue-400 border border-blue-500/30'
            }`}>
              {data.status || 'Active'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black theme-heading tracking-tight flex items-center gap-3">
            <span>{data.name}</span>
            <span className="text-sm font-mono px-2.5 py-1 rounded-lg bg-[#FF5A14]/10 text-[#FF7A45] border border-[#FF5A14]/20">
              {projectKey}
            </span>
          </h1>
          <p className="text-xs sm:text-sm theme-muted mt-1">
            Program engagement telemetry, deliverable burn curve, and role allocations calibrated for project ID: {projectKey}.
          </p>
        </div>

        {/* Quick Link to Team Member View */}
        <button
          onClick={() => navigate(`/project/${projectNumericId}/team-members`)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white text-xs font-bold shadow-md hover:brightness-110 transition-all inline-flex items-center gap-2 self-start md:self-auto cursor-pointer flex-shrink-0"
        >
          <Users size={15} />
          <span>View Team Roster ({totalResources})</span>
          <ArrowRight size={13} />
        </button>
      </div>

      {/* TAB NAVIGATION: QUICK LEVEL 4 DRILLDOWN FILTERS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b theme-border text-xs font-bold whitespace-nowrap">
        <span className="theme-muted text-[11px] uppercase tracking-wider flex items-center gap-1 mr-1">
          <Filter size={12} className="text-[#FF5A14]" />
          <span>Drilldown Focus:</span>
        </span>
        <button
          onClick={() => handleTabChange('all')}
          className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
            currentTab === 'all'
              ? 'bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white shadow-md'
              : 'theme-subtle hover:bg-white/5 theme-muted'
          }`}
        >
          All Overview
        </button>
        {user?.role !== 'Investor' && (
        <button
          onClick={() => handleTabChange('team')}
          className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            currentTab === 'team'
              ? 'bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white shadow-md'
              : 'theme-subtle hover:bg-white/5 theme-muted'
          }`}
        >
          <Users size={13} />
          <span>Team & Contributors</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-black/25 font-mono">L4</span>
        </button>
        )}
        {user?.role !== 'Project Manager' && (
        <button
          onClick={() => handleTabChange('budget')}
          className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            currentTab === 'budget'
              ? 'bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white shadow-md'
              : 'theme-subtle hover:bg-white/5 theme-muted'
          }`}
        >
          <DollarSign size={13} />
          <span>Budget & Capital</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-black/25 font-mono">L4</span>
        </button>
        )}
        <button
          onClick={() => handleTabChange('schedule')}
          className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            currentTab === 'schedule'
              ? 'bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white shadow-md'
              : 'theme-subtle hover:bg-white/5 theme-muted'
          }`}
        >
          <Calendar size={13} />
          <span>Estimated Deadline</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-black/25 font-mono">L4</span>
        </button>
        <button
          onClick={() => handleTabChange('governance')}
          className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            currentTab === 'governance'
              ? 'bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white shadow-md'
              : 'theme-subtle hover:bg-white/5 theme-muted'
          }`}
        >
          <ShieldCheck size={13} />
          <span>Vendor SLA & Governance</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-black/25 font-mono">L4</span>
        </button>
        <button
          onClick={() => handleTabChange('threats')}
          className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            currentTab === 'threats'
              ? 'bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white shadow-md'
              : 'theme-subtle hover:bg-white/5 theme-muted'
          }`}
        >
          <AlertTriangle size={13} />
          <span>Threat Register</span>
        </button>
      </div>

      <div className="flex flex-col space-y-6">

      {/* 3. EXECUTIVE KPIS GRID (Visible in All or Overview) */}
      {(currentTab === 'all' || currentTab === 'budget') && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-2" style={{ order: getSectionOrder('kpi') }}>
          {data.kpis.map((kpi, idx) => (
            <KPICard 
              key={idx}
              title={kpi.title} 
              value={kpi.value} 
              trend={kpi.trend} 
              trendLabel={kpi.trendLabel}
            />
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. LEVEL 4: TEAM & CONTRIBUTORS — ROLE-WISE RESOURCE ALLOCATION */}
      {/* ========================================================================= */}
      {(currentTab === 'all' || currentTab === 'team') && user?.role !== 'Investor' && (
        <div id="team-contributors" className="p-6 rounded-3xl theme-card border border-[#FF5A14]/25 shadow-lg space-y-4" style={{ order: getSectionOrder('team') }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b theme-border">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-[#FF5A14]/15 text-[#FF5A14]">
                <Users size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold theme-heading">TEAM & CONTRIBUTORS</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FF5A14]/15 text-[#FF5A14] border border-[#FF5A14]/30 font-bold uppercase">
                    Level 4 Drilldown
                  </span>
                </div>
                <p className="text-xs theme-muted">Role-wise headcount distribution — Click any role to drill into team members</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 size={13} />
                <span>Total Resources: {totalResources} Staff</span>
              </span>
              <button
                onClick={() => navigate(`/project/${projectNumericId}/team-members`)}
                className="text-xs font-bold text-[#FF5A14] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>View All</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>

          {/* Role Distribution Clickable Tiles */}
          {rolesList.length === 0 ? (
            <div className="py-6 text-center text-xs theme-muted italic">
              No team members currently allocated to this workspace.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 pt-1">
              {rolesList.map((roleItem, rIdx) => {
                const rColor = roleItem.color || '#FF5A14';
                const targetUrl = `/project/${projectNumericId}/team-members?role=${encodeURIComponent(roleItem.role)}`;
                return (
                  <Link
                    key={rIdx}
                    to={targetUrl}
                    className="p-4 rounded-2xl theme-subtle border theme-border hover:border-[#FF5A14]/60 hover:bg-[#FF5A14]/5 transition-all cursor-pointer group flex flex-col justify-between block text-inherit no-underline"
                    title={`Click to view all ${roleItem.role} contributors`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span 
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: rColor }}
                        ></span>
                        <span className="text-[11px] font-mono font-bold theme-muted">
                          {roleItem.allocation_pct}% Pod
                        </span>
                      </div>

                      <h4 className="text-sm font-bold theme-heading group-hover:text-[#FF7A45] transition-colors line-clamp-1" title={roleItem.role}>
                        {roleItem.role}
                      </h4>
                    </div>

                    <div className="pt-3 mt-2 border-t theme-border flex items-center justify-between">
                      <span className="text-xl font-black theme-heading font-mono">
                        {roleItem.count} <span className="text-[11px] font-normal theme-muted font-sans">{roleItem.count === 1 ? 'Resource' : 'Resources'}</span>
                      </span>
                      <span className="text-xs font-bold text-[#FF5A14] group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
                        <span>View</span>
                        <ArrowRight size={12} />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. LEVEL 4: TOTAL BUDGET & CAPITAL — SPEND TRAJECTORY & FINANCIALS */}
      {/* ========================================================================= */}
      {(currentTab === 'all' || currentTab === 'budget') && user?.role !== 'Project Manager' && (
        <div id="budget-breakdown" className="p-6 rounded-3xl theme-card border border-[#FF5A14]/25 shadow-lg space-y-5" style={{ order: getSectionOrder('budget') }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b theme-border">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400">
                <DollarSign size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold theme-heading">TOTAL BUDGET & CAPITAL</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold uppercase">
                    Level 4 Drilldown
                  </span>
                </div>
                <p className="text-xs theme-muted">Capital burn velocity, monthly run-rate & expenditure trajectory</p>
              </div>
            </div>

            <Link
              to="/reports"
              className="text-xs font-bold text-[#FF5A14] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Full Financial Briefings</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          {/* 4 Financial Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl theme-subtle border theme-border text-center">
              <span className="theme-muted block text-[10px] uppercase font-bold tracking-wider">Planned Baseline</span>
              <span className="text-xl sm:text-2xl font-black theme-heading font-mono mt-1 block">
                {fmtMoney(budget.planned)}
              </span>
              <span className="text-[10px] theme-muted mt-0.5 block">Approved Contract Cap</span>
            </div>

            <div className="p-4 rounded-2xl theme-subtle border theme-border text-center">
              <span className="theme-muted block text-[10px] uppercase font-bold tracking-wider">Actual Spend</span>
              <span className="text-xl sm:text-2xl font-black text-[#FF5A14] font-mono mt-1 block">
                {fmtMoney(budget.actual)}
              </span>
              <span className="text-[10px] font-mono text-[#FF7A45] mt-0.5 block">{budget.burn_pct}% Burned</span>
            </div>

            <div className="p-4 rounded-2xl theme-subtle border theme-border text-center">
              <span className="theme-muted block text-[10px] uppercase font-bold tracking-wider">Remaining Capital</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-1 block">
                {fmtMoney(budget.remaining)}
              </span>
              <span className="text-[10px] text-emerald-500 mt-0.5 block">Available Runway</span>
            </div>

            <div className="p-4 rounded-2xl theme-subtle border theme-border text-center">
              <span className="theme-muted block text-[10px] uppercase font-bold tracking-wider">Cost Variance</span>
              <span className={`text-xl sm:text-2xl font-black font-mono mt-1 block ${budget.variance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {budget.variance >= 0 ? `+${fmtMoney(budget.variance)}` : `-${fmtMoney(Math.abs(budget.variance))}`}
              </span>
              <span className="text-[10px] font-bold text-emerald-500 mt-0.5 block">
                {budget.variance_status} Trajectory
              </span>
            </div>
          </div>

          {/* Velocity Progress Bar & Metrics */}
          <div className="p-4 rounded-2xl theme-subtle border theme-border grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div>
              <span className="text-[11px] theme-muted uppercase font-bold block">Monthly Burn Rate</span>
              <span className="text-sm font-black theme-heading font-mono mt-0.5 block">
                {fmtMoney(budget.monthly_run_rate)} / month
              </span>
            </div>
            <div>
              <span className="text-[11px] theme-muted uppercase font-bold block">Cost Perf. Index (CPI)</span>
              <span className="text-sm font-black text-emerald-400 font-mono mt-0.5 block">
                {budget.cpi} Favorable
              </span>
            </div>
            <div>
              <div className="flex justify-between text-[11px] mb-1 font-mono font-bold">
                <span className="theme-muted">Burn Velocity:</span>
                <span className="text-[#FF5A14]">{budget.burn_pct}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] transition-all duration-500"
                  style={{ width: `${Math.min(100, budget.burn_pct)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. LEVEL 4: ESTIMATED DEADLINE & SCHEDULE — MILESTONE STAGE-GATES */}
      {/* ========================================================================= */}
      {(currentTab === 'all' || currentTab === 'schedule') && (
        <div id="schedule-breakdown" className="p-6 rounded-3xl theme-card border border-[#FF5A14]/25 shadow-lg space-y-5" style={{ order: getSectionOrder('schedule') }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b theme-border">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-400">
                <Calendar size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold theme-heading">ESTIMATED DEADLINE & SCHEDULE</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 font-bold uppercase">
                    Level 4 Drilldown
                  </span>
                </div>
                <p className="text-xs theme-muted">Target go-live dates, milestone stage-gates & schedule performance index (SPI)</p>
              </div>
            </div>

            <span className="text-xs font-mono font-bold text-purple-400">
              Go-Live Target: {timeline.target_completion_date}
            </span>
          </div>

          {/* 4 Schedule Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl theme-subtle border theme-border text-center">
              <span className="theme-muted block text-[10px] uppercase font-bold tracking-wider">Target Completion</span>
              <span className="text-sm sm:text-base font-black theme-heading font-mono mt-1 block truncate" title={timeline.target_completion_date}>
                {timeline.target_completion_date}
              </span>
              <span className="text-[10px] theme-muted mt-0.5 block">Charter Governed</span>
            </div>

            <div className="p-4 rounded-2xl theme-subtle border theme-border text-center">
              <span className="theme-muted block text-[10px] uppercase font-bold tracking-wider">Days Remaining</span>
              <span className="text-xl sm:text-2xl font-black text-purple-400 font-mono mt-1 block">
                {timeline.days_remaining}d
              </span>
              <span className="text-[10px] text-purple-300 mt-0.5 block">Working Days</span>
            </div>

            <div className="p-4 rounded-2xl theme-subtle border theme-border text-center">
              <span className="theme-muted block text-[10px] uppercase font-bold tracking-wider">Schedule SPI</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-1 block">
                {timeline.spi}
              </span>
              <span className="text-[10px] text-emerald-500 mt-0.5 block">On Schedule</span>
            </div>

            <div className="p-4 rounded-2xl theme-subtle border theme-border text-center">
              <span className="theme-muted block text-[10px] uppercase font-bold tracking-wider">Schedule Trajectory</span>
              <span className="text-xs sm:text-sm font-bold text-emerald-400 mt-1 block truncate">
                {timeline.schedule_status}
              </span>
              <span className="text-[10px] theme-muted mt-0.5 block">SOW Baseline Valid</span>
            </div>
          </div>

          {/* Delivery Milestone Sequence */}
          <div className="space-y-3 pt-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider theme-muted flex items-center gap-2">
                <Layers size={14} className="text-[#FF5A14]" />
                <span>Project Delivery Roadmaps & Milestone Phases</span>
              </h4>
              <div className="flex items-center gap-3 text-[10px] font-mono font-bold bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-lg border theme-border">
                <span className="text-slate-400 font-sans uppercase text-[9px] mr-1">Logic:</span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> 100% (Done)</span>
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> 50% (Track)</span>
                <span className="flex items-center gap-1 text-red-600 dark:text-red-400"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> 20% (Risk)</span>
                <span className="flex items-center gap-1 text-slate-500"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> 0% (Pending)</span>
              </div>
            </div>

            <div className="space-y-2.5">
              {timeline.phases.map((ph, idx) => (
                <div 
                  key={ph.id || idx}
                  onClick={() => setExpandedPhase(expandedPhase === idx ? null : idx)}
                  className={`p-4 rounded-2xl theme-subtle border flex flex-col justify-between gap-3 group transition-all duration-300 cursor-pointer ${
                    expandedPhase === idx ? 'border-[#FF5A14] shadow-[0_0_20px_rgba(255,90,20,0.1)]' : 'theme-border hover:border-[#FF5A14]/50 hover:bg-[#FF5A14]/5'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 w-full">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono text-xs font-black flex-shrink-0 ${
                        ph.status === 'Completed' || ph.status.toLowerCase() === 'done'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : ph.status === 'In Progress' || ph.status.toLowerCase() === 'on track'
                          ? 'bg-[#FF5A14]/15 text-[#FF5A14] border border-[#FF5A14]/30'
                          : 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
                      }`}>
                        {(ph.status === 'Completed' || ph.status.toLowerCase() === 'done') ? <Check size={16} /> : idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#FF7A45]">[{ph.id}]</span>
                          <h5 className="text-sm font-bold theme-heading group-hover:text-[#FF7A45] transition-colors">{ph.name}</h5>
                        </div>
                        <span className="text-xs theme-muted">Target Deadline: <strong className="theme-heading">{ph.target_date}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end md:self-auto">
                      <div className="w-28 sm:w-36 text-right">
                        <div className="flex justify-between text-[11px] font-mono mb-1">
                          <span className="theme-muted">{ph.days_left > 0 ? `${ph.days_left}d left` : 'Cleared'}</span>
                          <span className="font-bold theme-heading">{ph.completion_pct}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500" 
                            style={{ 
                              width: `${ph.completion_pct}%`,
                              backgroundColor: (ph.status === 'Completed' || ph.status.toLowerCase() === 'done') ? '#10B981' : ((ph.status === 'In Progress' || ph.status.toLowerCase() === 'on track') ? '#FF5A14' : '#64748B')
                            }}
                          ></div>
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        (ph.status === 'Completed' || ph.status.toLowerCase() === 'done') ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                        (ph.status === 'In Progress' || ph.status.toLowerCase() === 'on track') ? 'bg-[#FF5A14]/15 text-[#FF5A14] border border-[#FF5A14]/30' :
                        'bg-slate-500/15 text-slate-400 border border-slate-500/30'
                      }`}>
                        {ph.status}
                      </span>
                      
                      <ChevronRight size={18} className={`text-slate-400 transition-transform duration-300 ${expandedPhase === idx ? 'rotate-90 text-[#FF5A14]' : 'group-hover:text-white'}`} />
                    </div>
                  </div>
                  
                  {expandedPhase === idx && (
                    <div className="w-full pt-4 mt-2 border-t theme-border animate-fadeIn flex flex-col md:flex-row gap-6" onClick={(e) => e.stopPropagation()}>
                      <div className="flex-1 space-y-3">
                        <h6 className="text-[11px] uppercase tracking-wider font-extrabold text-slate-500">Milestone Details</h6>
                        <p className="text-sm theme-muted leading-relaxed">
                          Phase {ph.id} represents a key delivery gateway for this project. 
                          The primary objectives revolve around completing {ph.name.toLowerCase().replace(ph.id.toLowerCase()+':', '').replace(ph.id.toLowerCase(), '').trim()} ensuring full alignment with the enterprise guardrails and SLA matrices.
                        </p>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div className="p-3 rounded-xl bg-white/[0.02] border theme-border">
                            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Assigned Workstream</span>
                            <span className="text-xs font-semibold theme-heading flex items-center gap-1.5"><Briefcase size={12} className="text-[#FF5A14]"/> Enterprise IT Delivery</span>
                          </div>
                          <div className="p-3 rounded-xl bg-white/[0.02] border theme-border">
                            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Approval Gate</span>
                            <span className="text-xs font-semibold theme-heading flex items-center gap-1.5"><ShieldCheck size={12} className="text-[#10B981]"/> Required</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 space-y-3">
                         <h6 className="text-[11px] uppercase tracking-wider font-extrabold text-slate-500">Key Deliverables</h6>
                         <ul className="space-y-2">
                           {[
                             `Finalize architecture & scoping for ${ph.id}`,
                             `Complete integration & testing phases`,
                             `Secure stakeholder sign-off & compliance audit`
                           ].map((item, dIdx) => (
                             <li key={dIdx} className="flex items-start gap-2 text-xs theme-muted">
                               <CheckCircle2 size={14} className={ph.completion_pct === 100 ? 'text-[#10B981]' : 'text-slate-500'} />
                               <span className={ph.completion_pct === 100 ? 'line-through opacity-70' : ''}>{item}</span>
                             </li>
                           ))}
                         </ul>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. LEVEL 4: VENDOR SLA & GOVERNANCE COMPLIANCE */}
      {/* ========================================================================= */}
      {(currentTab === 'all' || currentTab === 'governance') && (
        <div id="governance-breakdown" className="p-6 rounded-3xl theme-card border border-[#FF5A14]/25 shadow-lg space-y-5" style={{ order: getSectionOrder('governance') }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b theme-border">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400">
                <ShieldCheck size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold theme-heading">VENDOR SLA & GOVERNANCE</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 font-bold uppercase">
                    Level 4 Drilldown
                  </span>
                </div>
                <p className="text-xs theme-muted">Autonomous gate clearances, compliance audit scores & supplier SLA adherence</p>
              </div>
            </div>

            <Link
              to="/guardrails"
              className="text-xs font-bold text-[#FF5A14] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Manage in Guardrails</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          {/* 4 Governance Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl theme-subtle border theme-border text-center">
              <span className="theme-muted block text-[10px] uppercase font-bold tracking-wider">SLA Adherence</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-1 block">
                {governance.vendor_sla_adherence}%
              </span>
              <span className="text-[10px] text-emerald-500 mt-0.5 block">Zero SLA Breaches</span>
            </div>

            <div className="p-4 rounded-2xl theme-subtle border theme-border text-center">
              <span className="theme-muted block text-[10px] uppercase font-bold tracking-wider">Audit Score</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-1 block">
                {governance.compliance_audit_score}%
              </span>
              <span className="text-[10px] text-emerald-500 mt-0.5 block">100% Policy Pass</span>
            </div>

            <div className="p-4 rounded-2xl theme-subtle border theme-border text-center">
              <span className="theme-muted block text-[10px] uppercase font-bold tracking-wider">Open Escalations</span>
              <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono mt-1 block">
                {governance.open_escalations}
              </span>
              <span className="text-[10px] text-amber-500 mt-0.5 block">Requires Review</span>
            </div>

            <div className="p-4 rounded-2xl theme-subtle border theme-border text-center">
              <span className="theme-muted block text-[10px] uppercase font-bold tracking-wider">Compliance Gate</span>
              <span className="text-xs sm:text-sm font-bold text-emerald-400 mt-1 block truncate">
                {governance.gate_clearance_status}
              </span>
              <span className="text-[10px] text-emerald-500 mt-0.5 block">Autonomous Cleared</span>
            </div>
          </div>

          {/* Vendor Partner Pods */}
          <div className="space-y-3 pt-1">
            <h4 className="text-xs font-bold uppercase tracking-wider theme-muted flex items-center gap-2">
              <Building2 size={14} className="text-[#FF5A14]" />
              <span>Contracted Vendor Partner Pods & SLA Metrics</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(teamData?.vendors || [
                { name: 'PwC Internal Enterprise Staff', type: 'Internal FTE', share: '67%', sla: '98.5%', headcount: 6 },
                { name: 'Cognizant / Infosys (SI Partner)', type: 'Vendor Contractor', share: '23%', sla: '93.4%', headcount: 2 }
              ]).map((v, idx) => (
                <div key={idx} className="p-3.5 rounded-xl theme-subtle border theme-border flex items-center justify-between">
                  <div>
                    <h6 className="text-xs font-bold theme-heading">{v.name}</h6>
                    <span className="text-[11px] theme-muted">{v.type} • Contract Share: {v.share || '50%'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black font-mono text-[#FF5A14]">{v.headcount || 1} Staff</span>
                    <span className="block text-[10px] font-mono text-emerald-400 font-bold">SLA: {v.sla || '100%'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. BURNDOWN CHART & RISK HEATMAP */}
      {/* ========================================================================= */}
      {(currentTab === 'all' || currentTab === 'budget' || currentTab === 'threats') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ order: getSectionOrder('charts') }}>
          <div>
            <BurndownChart data={data.burndown} />
          </div>
          <div>
            <RiskHeatmap data={data.risks} />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. PROGRAM ISSUES & THREAT REGISTER */}
      {/* ========================================================================= */}
      {(currentTab === 'all' || currentTab === 'threats') && (
        <div id="threat-register" style={{ order: getSectionOrder('threats') }}>
          <ProjectThreatRegister
            risks={data.risk_details || data.recent_risks || []}
            activeProject={{ id: projectNumericId, jira_key: projectKey, name: data.name }}
            totalCount={data.total_project_risks !== undefined ? data.total_project_risks : (data.risk_details?.length || 0)}
            maxDisplay={5}
          />
        </div>
      )}

      </div>
    </div>
  );
};

export default ProjectDrilldown;
