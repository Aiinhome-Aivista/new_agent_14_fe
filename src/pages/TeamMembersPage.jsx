import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { dashboardApi } from '../api/dashboardApi';
import FuturisticLoader from '../components/common/FuturisticLoader';
import { 
  Users, 
  Search, 
  ArrowLeft, 
  ArrowRight, 
  Mail, 
  Briefcase, 
  CheckCircle2, 
  ShieldCheck, 
  Layers, 
  Filter, 
  X, 
  FolderKanban,
  ExternalLink,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Check
} from 'lucide-react';

const TeamMembersPage = () => {
  const { id: routeId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeProject, selectProject, projects } = useProject();

  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [vendorFilter, setVendorFilter] = useState('All');
  // Role filter synced with URL query param '?role=...'
  const selectedRole = searchParams.get('role') || 'All';

  // Target project identifier from URL or active context
  const targetPid = routeId || activeProject?.jira_key || activeProject?.id || '1';

  // Custom Dropdown Open States and Refs
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false);
  const roleDropdownRef = useRef(null);
  const vendorDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target)) {
        setIsRoleDropdownOpen(false);
      }
      if (vendorDropdownRef.current && !vendorDropdownRef.current.contains(e.target)) {
        setIsVendorDropdownOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsRoleDropdownOpen(false);
        setIsVendorDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchTeam = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await dashboardApi.getProjectTeam(targetPid);
        if (isMounted) {
          setTeamData(res);
          // Sync project context if needed
          if (res?.project && (!activeProject || (activeProject.id !== res.project.id && activeProject.jira_key !== res.project.jira_key))) {
            selectProject(res.project);
          }
        }
      } catch (err) {
        console.error("Failed to load team data", err);
        if (isMounted) {
          setError("Unable to load project team data. Please ensure the project exists and you have authorized access.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchTeam();
    return () => { isMounted = false; };
  }, [targetPid]);

  const handleRoleChange = (role) => {
    const nextParams = new URLSearchParams(searchParams);
    if (!role || role === 'All') {
      nextParams.delete('role');
    } else {
      nextParams.set('role', role);
    }
    setSearchParams(nextParams);
  };

  const project = teamData?.project || activeProject || { id: targetPid, jira_key: targetPid, name: 'Project Workspace' };
  const members = teamData?.members || [];
  const availableRoles = teamData?.roles || [];
  const availableVendors = teamData?.vendors || [];

  // Filtered members calculation
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      // Role match
      const roleMatch = selectedRole === 'All' || 
        m.role.toLowerCase() === selectedRole.toLowerCase() ||
        (selectedRole.toLowerCase().includes('architect') && m.role.toLowerCase().includes('architect')) ||
        (selectedRole.toLowerCase().includes('dev') && (m.role.toLowerCase().includes('dev') || m.role.toLowerCase().includes('engineer'))) ||
        (selectedRole.toLowerCase().includes('qa') && (m.role.toLowerCase().includes('qa') || m.role.toLowerCase().includes('test')));

      // Vendor match
      const vendorMatch = vendorFilter === 'All' || m.vendor === vendorFilter;

      // Search match
      const q = searchTerm.trim().toLowerCase();
      const searchMatch = !q || 
        m.name.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q) ||
        (m.email && m.email.toLowerCase().includes(q)) ||
        (m.skills && m.skills.some(s => s.toLowerCase().includes(q)));

      return roleMatch && vendorMatch && searchMatch;
    });
  }, [members, selectedRole, vendorFilter, searchTerm]);

  if (loading) {
    return (
      <FuturisticLoader 
        title={`Synchronizing Team Telemetry...`} 
        subtitle={`Loading contributor roster, skill matrices, and allocations for ${project.name || targetPid}`}
      />
    );
  }

  if (error || !teamData) {
    return (
      <div className="py-12 px-4 max-w-2xl mx-auto text-center">
        <div className="p-8 rounded-3xl theme-card border border-red-500/30">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4">
            <Users size={32} />
          </div>
          <h2 className="text-xl font-bold theme-heading mb-2">Project Team Unavailable</h2>
          <p className="text-xs sm:text-sm theme-muted mb-6 leading-relaxed">
            {error || "We could not find the team roster for the specified project."}
          </p>
          <button
            onClick={() => navigate(`/project/${targetPid}`)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white text-xs font-bold shadow-lg hover:brightness-110 transition-all inline-flex items-center gap-2"
          >
            <ArrowLeft size={14} />
            <span>Return to Project Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  // Persona dashboard route helper
  const getPersonaDashboardLabel = () => {
    if (user?.role === 'PMO') return 'PMO Command Center';
    if (user?.role === 'Program Director') return 'Program Governance';
    if (user?.role === 'Project Manager') return 'Project Execution';
    return 'Executive Dashboard';
  };

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

          <span className="text-[#FF5A14] font-bold flex items-center gap-1">
            <Users size={13} />
            <span>Team Members</span>
          </span>

          {selectedRole !== 'All' && (
            <>
              <ChevronRight size={13} className="text-slate-500 dark:text-slate-600 flex-shrink-0" />
              <span className="px-2 py-0.5 rounded-md bg-[#FF5A14]/15 text-[#FF7A45] border border-[#FF5A14]/30 font-bold font-mono text-[11px]">
                {selectedRole}
              </span>
            </>
          )}
        </nav>

        {/* Back Button */}
        <button 
          onClick={() => navigate(`/project/${project.id || targetPid}`)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl theme-subtle border theme-border hover:border-[#FF5A14]/50 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all self-start sm:self-auto cursor-pointer"
        >
          <ArrowLeft size={13} className="text-[#FF5A14]" />
          <span>Back to Project Dashboard</span>
        </button>
      </div>

      {/* 2. PAGE HEADER & SUMMARY STATS */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#FF5A14]/15 text-[#FF5A14] border border-[#FF5A14]/30">
              Level 5 Drilldown: Project Team
            </span>
            <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 size={12} />
              <span>{members.length} Total Contributors</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black theme-heading tracking-tight flex items-center gap-3">
            <span>Project Team & Contributors</span>
            <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-[#FF5A14]/10 text-[#FF7A45] border border-[#FF5A14]/20">
              {project.jira_key || targetPid}
            </span>
          </h1>
          <p className="text-xs sm:text-sm theme-muted mt-1 max-w-3xl">
            Roster governance, discipline breakdown, and contributor deliverables for <strong>{project.name}</strong>.
          </p>
        </div>

        {/* Quick Scope Badge */}
        <div className="p-3 rounded-2xl theme-card border theme-border flex items-center gap-4 flex-shrink-0">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold theme-muted block">Visible Scope</span>
            <span className="text-sm font-black text-[#FF5A14] font-mono">
              {filteredMembers.length} of {members.length} Staff
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF5A14] to-[#E04808] flex items-center justify-center text-white shadow-md">
            <Users size={20} />
          </div>
        </div>
      </div>

      {/* 3. INTERACTIVE FILTER & SEARCH TOOLBAR */}
      <div className="p-4 rounded-2xl theme-card border theme-border space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search contributors by name, skills, or email..."
              className="w-full pl-10 pr-10 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0E1422] border border-slate-200 dark:border-white/10 focus:border-[#FF5A14] outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Role Filter Custom Dropdown */}
          <div className="relative" ref={roleDropdownRef}>
            <div className="flex items-center gap-2">
              <Filter size={15} className="text-[#FF5A14] flex-shrink-0" />
              <span className="text-xs theme-muted font-bold whitespace-nowrap">Role Filter:</span>
              <button
                type="button"
                onClick={() => {
                  setIsRoleDropdownOpen(!isRoleDropdownOpen);
                  setIsVendorDropdownOpen(false);
                }}
                className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer select-none min-w-[210px] ${
                  isRoleDropdownOpen 
                    ? 'border-[#FF5A14] ring-1 ring-[#FF5A14]/30 bg-white dark:bg-[#131A29]' 
                    : 'border-slate-200 dark:border-white/10 hover:border-[#FF5A14]/50 bg-slate-50 dark:bg-[#131A29]'
                } text-slate-900 dark:text-slate-100 shadow-sm`}
              >
                <span className="truncate">
                  {selectedRole === 'All' ? `All Roles (${members.length})` : selectedRole}
                </span>
                <ChevronDown size={14} className={`text-slate-400 flex-shrink-0 transition-transform duration-200 ${isRoleDropdownOpen ? 'rotate-180 text-[#FF5A14]' : ''}`} />
              </button>
            </div>

            {isRoleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 max-h-80 overflow-y-auto no-scrollbar rounded-2xl bg-white dark:bg-[#131A29] p-1.5 border border-slate-200 dark:border-white/15 shadow-2xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.85)] z-50 animate-fadeIn">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500 dark:text-slate-400">
                    Filter by Contributor Role
                  </span>
                  <span className="text-[10px] font-mono text-[#FF7A45] font-semibold">
                    {members.length} Contributors
                  </span>
                </div>

                <div className="py-1 space-y-1">
                  {/* All Roles Option */}
                  <button
                    type="button"
                    onClick={() => {
                      handleRoleChange('All');
                      setIsRoleDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      selectedRole === 'All'
                        ? 'bg-[#FF5A14]/15 text-[#FF7A45] font-bold border border-[#FF5A14]/30'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span className="truncate">All Roles</span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-white/[0.08] text-slate-600 dark:text-slate-300">
                        {members.length}
                      </span>
                      {selectedRole === 'All' && <Check size={14} className="text-[#FF5A14]" />}
                    </div>
                  </button>

                  {/* Individual Roles */}
                  {availableRoles.map(r => {
                    const isSelected = selectedRole.toLowerCase() === r.role.toLowerCase();
                    return (
                      <button
                        key={r.role}
                        type="button"
                        onClick={() => {
                          handleRoleChange(r.role);
                          setIsRoleDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 rounded-xl text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#FF5A14]/15 text-[#FF7A45] font-bold border border-[#FF5A14]/30'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <span className="truncate pr-2">{r.role}</span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-white/[0.08] text-slate-600 dark:text-slate-300">
                            {r.count}
                          </span>
                          {isSelected && <Check size={14} className="text-[#FF5A14]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Vendor Organization Custom Dropdown */}
          <div className="relative" ref={vendorDropdownRef}>
            <div className="flex items-center gap-2">
              <Briefcase size={15} className="text-slate-400 flex-shrink-0" />
              <span className="text-xs theme-muted font-bold whitespace-nowrap">Vendor:</span>
              <button
                type="button"
                onClick={() => {
                  setIsVendorDropdownOpen(!isVendorDropdownOpen);
                  setIsRoleDropdownOpen(false);
                }}
                className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer select-none min-w-[200px] ${
                  isVendorDropdownOpen 
                    ? 'border-[#FF5A14] ring-1 ring-[#FF5A14]/30 bg-white dark:bg-[#131A29]' 
                    : 'border-slate-200 dark:border-white/10 hover:border-[#FF5A14]/50 bg-slate-50 dark:bg-[#131A29]'
                } text-slate-900 dark:text-slate-100 shadow-sm`}
              >
                <span className="truncate">
                  {vendorFilter === 'All' ? 'All Organizations' : vendorFilter}
                </span>
                <ChevronDown size={14} className={`text-slate-400 flex-shrink-0 transition-transform duration-200 ${isVendorDropdownOpen ? 'rotate-180 text-[#FF5A14]' : ''}`} />
              </button>
            </div>

            {isVendorDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 max-h-80 overflow-y-auto no-scrollbar rounded-2xl bg-white dark:bg-[#131A29] p-1.5 border border-slate-200 dark:border-white/15 shadow-2xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.85)] z-50 animate-fadeIn">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500 dark:text-slate-400">
                    Filter by Vendor Organization
                  </span>
                  <span className="text-[10px] font-mono text-[#FF7A45] font-semibold">
                    {availableVendors.length} Organizations
                  </span>
                </div>

                <div className="py-1 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setVendorFilter('All');
                      setIsVendorDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      vendorFilter === 'All'
                        ? 'bg-[#FF5A14]/15 text-[#FF7A45] font-bold border border-[#FF5A14]/30'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span className="truncate">All Organizations</span>
                    {vendorFilter === 'All' && <Check size={14} className="text-[#FF5A14]" />}
                  </button>

                  {availableVendors.map(v => {
                    const isSelected = vendorFilter === v.name;
                    return (
                      <button
                        key={v.name}
                        type="button"
                        onClick={() => {
                          setVendorFilter(v.name);
                          setIsVendorDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 rounded-xl text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#FF5A14]/15 text-[#FF7A45] font-bold border border-[#FF5A14]/30'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <span className="truncate pr-2">{v.name}</span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-white/[0.08] text-slate-600 dark:text-slate-300">
                            {v.count}
                          </span>
                          {isSelected && <Check size={14} className="text-[#FF5A14]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Active Filter Pills Ribbon */}
        {(selectedRole !== 'All' || vendorFilter !== 'All' || searchTerm) && (
          <div className="pt-2 border-t theme-border flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="theme-muted font-bold text-[11px]">Active Filters:</span>
              
              {selectedRole !== 'All' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#FF5A14]/15 text-[#FF7A45] border border-[#FF5A14]/30 font-semibold font-mono text-[11px]">
                  <span>Role: {selectedRole}</span>
                  <button onClick={() => handleRoleChange('All')} className="hover:text-white">
                    <X size={12} />
                  </button>
                </span>
              )}

              {vendorFilter !== 'All' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30 font-semibold text-[11px]">
                  <span>Vendor: {vendorFilter}</span>
                  <button onClick={() => setVendorFilter('All')} className="hover:text-white">
                    <X size={12} />
                  </button>
                </span>
              )}

              {searchTerm && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/30 font-semibold text-[11px]">
                  <span>Search: "{searchTerm}"</span>
                  <button onClick={() => setSearchTerm('')} className="hover:text-white">
                    <X size={12} />
                  </button>
                </span>
              )}
            </div>

            <button
              onClick={() => {
                handleRoleChange('All');
                setVendorFilter('All');
                setSearchTerm('');
              }}
              className="text-[11px] font-bold text-[#FF5A14] hover:underline cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* 4. RESOURCE CARDS GRID (LEVEL 5 -> LEVEL 6 DRILLDOWN) */}
      {filteredMembers.length === 0 ? (
        <div className="py-16 text-center theme-card rounded-2xl p-8 border border-dashed border-slate-300 dark:border-white/15">
          <Users className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold theme-heading">No Contributors Match Your Filter</h3>
          <p className="text-xs theme-muted mt-1 max-w-sm mx-auto leading-relaxed">
            {selectedRole !== 'All' 
              ? `No team members currently assigned with role "${selectedRole}".` 
              : `No team members match your search criteria "${searchTerm}".`}
          </p>
          <button
            onClick={() => {
              handleRoleChange('All');
              setVendorFilter('All');
              setSearchTerm('');
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-[#FF5A14] text-white text-xs font-bold shadow-md hover:brightness-110 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>Show All Team Members</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMembers.map((member) => {
            const roleColor = member.color || '#FF5A14';
            const initials = member.name
              .split(' ')
              .map(p => p[0])
              .join('')
              .toUpperCase()
              .substring(0, 2);

            const memberUrl = `/project/${project.id || targetPid}/team-members/${member.id}${selectedRole !== 'All' ? `?role=${encodeURIComponent(selectedRole)}` : ''}`;

            return (
              <Link
                key={member.id}
                to={memberUrl}
                className="theme-card p-5 sm:p-6 rounded-2xl border transition-all duration-300 hover:border-[#FF5A14]/60 hover:shadow-[0_10px_35px_rgba(0,0,0,0.45)] group flex flex-col justify-between relative overflow-hidden cursor-pointer block text-inherit no-underline"
                title={`Click to inspect complete contributor telemetry for ${member.name}`}
              >
                {/* Accent Top Ambient Line */}
                <div 
                  className="absolute top-0 left-0 right-0 h-1 transition-opacity opacity-0 group-hover:opacity-100"
                  style={{ background: `linear-gradient(to right, transparent, ${roleColor}, transparent)` }}
                ></div>

                <div>
                  {/* Top Contributor Avatar & Status Badges */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-extrabold text-sm shadow-md flex-shrink-0 tracking-wider"
                        style={{ background: `linear-gradient(135deg, ${roleColor}, #1E293B)` }}
                      >
                        {initials}
                      </div>
                      <div>
                        <h4 className="text-base font-bold theme-heading group-hover:text-[#FF7A45] transition-colors leading-tight">
                          {member.name}
                        </h4>
                        <span 
                          className="inline-block mt-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded-md border"
                          style={{
                            color: roleColor,
                            borderColor: `${roleColor}40`,
                            backgroundColor: `${roleColor}15`
                          }}
                        >
                          {member.role}
                        </span>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex-shrink-0">
                      {member.status || 'Active'}
                    </span>
                  </div>

                  {/* Vendor & Pod Organization */}
                  <div className="py-2.5 px-3 rounded-xl theme-subtle border theme-border mb-3 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="theme-muted font-medium">Organization:</span>
                      <span className="font-semibold theme-heading truncate max-w-[170px]" title={member.vendor}>
                        {member.vendor}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="theme-muted font-medium">Allocation:</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {member.allocation_pct || 100}% FTE
                      </span>
                    </div>
                  </div>

                  {/* Skills Pills */}
                  {member.skills && member.skills.length > 0 && (
                    <div className="mb-4">
                      <span className="text-[10px] uppercase font-bold tracking-wider theme-muted block mb-1.5">
                        Core Disciplines
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {member.skills.slice(0, 3).map((skill, sIdx) => (
                          <span 
                            key={sIdx} 
                            className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-[10px] font-medium theme-muted"
                          >
                            {skill}
                          </span>
                        ))}
                        {member.skills.length > 3 && (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono text-[#FF7A45] font-bold">
                            +{member.skills.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Deliverables Preview */}
                  <div className="pt-3 border-t theme-border text-xs flex items-center justify-between theme-muted">
                    <span className="flex items-center gap-1.5">
                      <Layers size={13} className="text-[#FF5A14]" />
                      <span>{member.assigned_tasks?.length || 2} Sprint Deliverables</span>
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      [{member.id}]
                    </span>
                  </div>
                </div>

                {/* Bottom Action Prompt */}
                <div className="mt-4 pt-3 border-t theme-border flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#FF5A14] group-hover:underline inline-flex items-center gap-1">
                    <span>Inspect Profile & Deliverables</span>
                    <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                    Level 6 →
                  </span>
                </div>

              </Link>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default TeamMembersPage;
