import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { dashboardApi } from '../api/dashboardApi';
import FuturisticLoader from '../components/common/FuturisticLoader';
import { 
  Users, 
  ArrowLeft, 
  Mail, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  ShieldCheck, 
  Layers, 
  Activity, 
  ChevronRight, 
  ExternalLink,
  Award,
  Sparkles,
  Calendar,
  AlertCircle
} from 'lucide-react';

const ResourceDetailPage = () => {
  const { id: routeProjectId, resourceId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeProject } = useProject();

  const [detailData, setDetailData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Preserve previous role filter for back navigation
  const prevRole = searchParams.get('role') || '';

  const targetPid = routeProjectId || activeProject?.jira_key || activeProject?.id || '1';

  useEffect(() => {
    let isMounted = true;
    const fetchResource = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await dashboardApi.getResourceDetail(targetPid, resourceId);
        if (isMounted) {
          setDetailData(res);
        }
      } catch (err) {
        console.error("Failed to load resource details", err);
        if (isMounted) {
          setError(`Unable to locate telemetry for contributor '${resourceId}' in project ${targetPid}.`);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchResource();
    return () => { isMounted = false; };
  }, [targetPid, resourceId]);

  if (loading) {
    return (
      <FuturisticLoader 
        title={`Accessing Contributor Telemetry...`} 
        subtitle={`Loading individual allocations, sprint deliverables, and governance gates for ${resourceId}`}
      />
    );
  }

  if (error || !detailData?.resource) {
    return (
      <div className="py-12 px-4 max-w-2xl mx-auto text-center">
        <div className="p-8 rounded-3xl theme-card border border-red-500/30">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4">
            <Users size={32} />
          </div>
          <h2 className="text-xl font-bold theme-heading mb-2">Contributor Profile Not Found</h2>
          <p className="text-xs sm:text-sm theme-muted mb-6 leading-relaxed">
            {error || `No contributor record found with identifier "${resourceId}".`}
          </p>
          <Link
            to={`/project/${targetPid}/team-members${prevRole ? `?role=${encodeURIComponent(prevRole)}` : ''}`}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white text-xs font-bold shadow-lg hover:brightness-110 transition-all inline-flex items-center gap-2 cursor-pointer no-underline"
          >
            <ArrowLeft size={14} />
            <span>Back to Project Team</span>
          </Link>
        </div>
      </div>
    );
  }

  const { project, resource } = detailData;
  const roleColor = resource.color || '#FF5A14';
  const initials = resource.name
    .split(' ')
    .map(p => p[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  const getPersonaDashboardLabel = () => {
    if (user?.role === 'PMO') return 'PMO Command Center';
    if (user?.role === 'Program Director') return 'Program Governance';
    if (user?.role === 'Project Manager') return 'Project Execution';
    return 'Executive Dashboard';
  };

  const backUrl = `/project/${project.id || targetPid}/team-members${prevRole ? `?role=${encodeURIComponent(prevRole)}` : ''}`;

  return (
    <div className="py-2 space-y-6 animate-fadeIn">
      
      {/* 1. TOP BREADCRUMBS & CONTEXTUAL NAVIGATION */}
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
            to={`/project/${project.id || targetPid}`}
            className="hover:text-[#FF5A14] transition-colors font-mono"
            title={`Return to Project Dashboard for ${project.jira_key || targetPid}`}
          >
            [{project.jira_key || targetPid}] {project.name}
          </Link>

          <ChevronRight size={13} className="text-slate-500 dark:text-slate-600 flex-shrink-0" />

          <Link 
            to={backUrl}
            className="hover:text-[#FF5A14] transition-colors flex items-center gap-1"
            title="Return to Project Team Members"
          >
            <Users size={13} />
            <span>Team Members</span>
          </Link>

          <ChevronRight size={13} className="text-slate-500 dark:text-slate-600 flex-shrink-0" />

          <span className="text-[#FF5A14] font-bold font-mono">
            {resource.name}
          </span>
        </nav>

        {/* Back Button */}
        <Link 
          to={backUrl}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl theme-subtle border theme-border hover:border-[#FF5A14]/50 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all self-start sm:self-auto cursor-pointer no-underline"
        >
          <ArrowLeft size={13} className="text-[#FF5A14]" />
          <span>Back to Team Members</span>
        </Link>
      </div>

      {/* 2. HERO PROFILE BANNER (LEVEL 6 DRILLDOWN) */}
      <div className="p-6 sm:p-7 rounded-3xl theme-card border border-[#FF5A14]/25 shadow-xl relative overflow-hidden">
        
        {/* Ambient Top Glow */}
        <div 
          className="absolute top-0 left-0 right-0 h-1.5"
          style={{ background: `linear-gradient(90deg, transparent, ${roleColor}, transparent)` }}
        ></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Avatar & Contributor Bio */}
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            <div 
              className="w-16 sm:w-20 h-16 sm:h-20 rounded-2xl sm:rounded-3xl flex items-center justify-center text-white font-black text-xl sm:text-2xl shadow-xl flex-shrink-0 tracking-wider border border-white/10"
              style={{ background: `linear-gradient(135deg, ${roleColor}, #0F172A)` }}
            >
              {initials}
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.05] border border-white/10 theme-muted font-bold">
                  {resource.id}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {resource.status || 'Active Contributor'}
                </span>
                <span className="text-xs font-mono text-[#FF7A45] font-semibold">
                  [{project.jira_key || targetPid}]
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black theme-heading tracking-tight mt-1">
                {resource.name}
              </h2>

              <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs">
                <span 
                  className="font-bold font-mono px-2.5 py-0.5 rounded-md border"
                  style={{
                    color: roleColor,
                    borderColor: `${roleColor}40`,
                    backgroundColor: `${roleColor}15`
                  }}
                >
                  {resource.role}
                </span>

                <span className="theme-muted flex items-center gap-1">
                  <Briefcase size={13} className="text-slate-400" />
                  <span>{resource.vendor}</span>
                </span>

                <a 
                  href={`mailto:${resource.email}`}
                  className="theme-muted hover:text-[#FF5A14] flex items-center gap-1 transition-colors font-mono"
                >
                  <Mail size={13} className="text-slate-400" />
                  <span>{resource.email}</span>
                </a>
              </div>
            </div>
          </div>

          {/* Allocation & Pod Assignment Widget */}
          <div className="p-4 rounded-2xl theme-subtle border theme-border flex items-center gap-5 lg:min-w-[300px]">
            <div className="flex-1">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="theme-muted font-bold">Dedicated Capacity:</span>
                <span className="font-mono font-black text-emerald-400">{resource.allocation_pct || 100}% FTE</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-[#FF5A14]"
                  style={{ width: `${resource.allocation_pct || 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center text-[10px] theme-muted mt-1 font-mono">
                <span>Contractual Staffing</span>
                <span>{resource.vendor_type || 'Internal FTE'}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 3. FOUR KPI CARDS (ALLOCATION, DELIVERABLES, VELOCITY, GOVERNANCE) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-4 rounded-2xl theme-card border theme-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#FF5A14]/15 text-[#FF5A14] border border-[#FF5A14]/30 flex items-center justify-center flex-shrink-0">
            <Activity size={22} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold theme-muted block">Allocation Level</span>
            <div className="text-2xl font-black theme-heading mt-0.5">{resource.allocation_pct || 100}%</div>
            <span className="text-[10px] text-emerald-400 font-semibold">Standard Pod Capacity</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl theme-card border theme-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/15 text-blue-500 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
            <Layers size={22} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold theme-muted block">Sprint Deliverables</span>
            <div className="text-2xl font-black theme-heading mt-0.5">{resource.assigned_tasks?.length || 2} Tasks</div>
            <span className="text-[10px] text-blue-400 font-semibold">Active Sprint Backlog</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl theme-card border theme-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={22} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold theme-muted block">Contractual SLA</span>
            <div className="text-2xl font-black theme-heading mt-0.5">98.5%</div>
            <span className="text-[10px] text-emerald-400 font-semibold">Compliant with SOW</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl theme-card border theme-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/15 text-purple-500 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
            <Award size={22} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold theme-muted block">Core Discipline</span>
            <div className="text-sm font-black theme-heading mt-0.5 truncate max-w-[140px]" title={resource.role}>
              {resource.role}
            </div>
            <span className="text-[10px] text-purple-400 font-semibold">Verified Pod Role</span>
          </div>
        </div>

      </div>

      {/* 4. MAIN DETAILS TABS & SECTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Assigned Tasks & Deliverables (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-5 sm:p-6 rounded-2xl theme-card border theme-border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b theme-border">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#FF5A14]/15 text-[#FF5A14]">
                  <Layers size={17} />
                </div>
                <div>
                  <h3 className="text-base font-bold theme-heading">Assigned Deliverables & Tasks</h3>
                  <p className="text-xs theme-muted">Sprint-level workstream commitments calibrated to project milestones</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-[#FF5A14]/10 text-[#FF7A45] border border-[#FF5A14]/20">
                {resource.assigned_tasks?.length || 0} Total
              </span>
            </div>

            <div className="space-y-3">
              {(resource.assigned_tasks || []).map((task, idx) => (
                <div 
                  key={task.id || idx}
                  className="p-4 rounded-xl theme-subtle border theme-border hover:border-[#FF5A14]/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#FF5A14]">[{task.id}]</span>
                      <h4 className="text-xs sm:text-sm font-bold theme-heading group-hover:text-[#FF7A45] transition-colors">
                        {task.title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-3 text-xs theme-muted">
                      <span>Workstream: <strong className="theme-heading">{task.workstream || resource.role}</strong></span>
                      <span>•</span>
                      <span>Target: <strong className="theme-heading">{task.due_date || 'Active Sprint'}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      task.status === 'Completed' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                      task.status === 'In Progress' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' :
                      'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }`}>
                      {task.status || 'Active'}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] theme-muted border border-white/5">
                      {task.priority || 'High'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Milestone Alignment Matrix */}
          <div className="p-5 sm:p-6 rounded-2xl theme-card border theme-border space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b theme-border">
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
                <CheckCircle2 size={17} />
              </div>
              <div>
                <h3 className="text-base font-bold theme-heading">Milestone Stage-Gate Alignments</h3>
                <p className="text-xs theme-muted">Phased roadmap sign-offs governed by this contributor's workstream</p>
              </div>
            </div>

            <div className="space-y-2.5">
              {(resource.linked_milestones || ['PH-01: Architecture Sign-off', 'PH-02: Core Service Dev']).map((ms, idx) => (
                <div 
                  key={idx}
                  className="p-3.5 rounded-xl theme-subtle border theme-border flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-[#FF5A14]/15 text-[#FF5A14] flex items-center justify-center font-mono font-bold text-xs">
                      {idx + 1}
                    </span>
                    <span className="font-bold theme-heading">{ms}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[10px] font-bold">
                    Governed Gate
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Skills, Governance & Workstream Context (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Technical Skills & Certifications */}
          <div className="p-5 sm:p-6 rounded-2xl theme-card border theme-border space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b theme-border">
              <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400">
                <Sparkles size={17} />
              </div>
              <div>
                <h3 className="text-base font-bold theme-heading">Technical Competencies</h3>
                <p className="text-xs theme-muted">Verified tools, frameworks, and architecture stacks</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {(resource.skills || []).map((skill, idx) => (
                <span 
                  key={idx}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-xs font-semibold theme-heading"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Governance & Workstream SLA Info */}
          <div className="p-5 sm:p-6 rounded-2xl theme-card border theme-border space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b theme-border">
              <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400">
                <ShieldCheck size={17} />
              </div>
              <div>
                <h3 className="text-base font-bold theme-heading">Governance & Partner Policy</h3>
                <p className="text-xs theme-muted">Enterprise compliance and vendor contract parameters</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl theme-subtle border theme-border flex items-center justify-between">
                <span className="theme-muted font-medium">Vendor Partner:</span>
                <span className="font-bold theme-heading">{resource.vendor}</span>
              </div>

              <div className="p-3 rounded-xl theme-subtle border theme-border flex items-center justify-between">
                <span className="theme-muted font-medium">Contract Type:</span>
                <span className="font-bold theme-heading">{resource.vendor_type || 'Internal FTE'}</span>
              </div>

              <div className="p-3 rounded-xl theme-subtle border theme-border flex items-center justify-between">
                <span className="theme-muted font-medium">Security Clearance:</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  <span>Enterprise Role-Based SSO</span>
                </span>
              </div>

              <div className="p-3 rounded-xl theme-subtle border theme-border flex items-center justify-between">
                <span className="theme-muted font-medium">Assigned Project:</span>
                <span className="font-bold font-mono text-[#FF7A45]">
                  [{project.jira_key || targetPid}] {project.name}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default ResourceDetailPage;
