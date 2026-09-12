import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { useToast } from '../context/ToastContext';
import FuturisticLoader from '../components/common/FuturisticLoader';
import { 
  FolderKanban, 
  Plus, 
  Search, 
  ArrowRight, 
  ShieldAlert, 
  DollarSign, 
  FileText, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  X, 
  Loader2, 
  AlertCircle,
  Briefcase,
  ExternalLink,
  Edit3
} from 'lucide-react';

const ProjectsPage = () => {
  const { user } = useAuth();
  const { projects, loadingProjects, selectProject, createProject, updateProject, refreshProjects } = useProject();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Edit Project Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    status: 'Active',
    planned_spend: 1000000,
    description: ''
  });

  // New Project Form State
  const [form, setForm] = useState({
    name: '',
    jira_key: '',
    description: '',
    planned_spend: 1500000,
    status: 'Active'
  });

  const isPMO = user?.role === 'PMO';

  const handleOpenWorkspace = (proj) => {
    selectProject(proj);
    showToast(`Switched workspace context to: ${proj.name} [${proj.jira_key}]`, 'info');
    navigate('/dashboard');
  };

  const handleOpenEditModal = (proj, e) => {
    if (e) e.stopPropagation();
    setEditingProject(proj);
    setEditForm({
      name: proj.name || '',
      status: proj.status || 'Active',
      planned_spend: proj.planned_spend || 1000000,
      description: proj.description || ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      showToast('Project Name is required', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await updateProject(editingProject.id, {
        name: editForm.name.trim(),
        status: editForm.status,
        planned_spend: Number(editForm.planned_spend) || 1000000,
        description: editForm.description.trim()
      });
      showToast(`Project "${editForm.name}" updated successfully!`, 'success');
      setIsEditModalOpen(false);
      setEditingProject(null);
    } catch (err) {
      console.error(err);
      const errDetail = err.response?.data?.error || 'Failed to update project.';
      showToast(errDetail, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'jira_key' ? value.toUpperCase().replace(/\s+/g, '-') : value
    }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast('Please provide a Project Name', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const res = await createProject({
        name: form.name.trim(),
        jira_key: form.jira_key.trim(),
        description: form.description.trim(),
        status: form.status,
        planned_spend: Number(form.planned_spend) || 1000000
      });
      showToast(res.message || `Project ${form.name} created successfully!`, 'success');
      setIsCreateModalOpen(false);
      setForm({
        name: '',
        jira_key: '',
        description: '',
        planned_spend: 1500000,
        status: 'Active'
      });
      if (res?.project) {
        handleOpenWorkspace(res.project);
      }
    } catch (err) {
      console.error(err);
      const errDetail = err.response?.data?.error || 'Failed to create project. Please verify fields.';
      showToast(errDetail, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered project list
  const filteredProjects = projects.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.jira_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Calculate portfolio summaries
  const totalAllocation = projects.reduce((acc, p) => acc + (Number(p.planned_spend) || 0), 0);
  const totalSpent = projects.reduce((acc, p) => acc + (Number(p.actual_spend) || 0), 0);
  const totalCritRisks = projects.reduce((acc, p) => acc + (Number(p.critical_risks_count) || 0), 0);
  const activeCount = projects.filter(p => p.status === 'Active').length;

  if (loadingProjects && projects.length === 0) {
    return (
      <FuturisticLoader 
        title="Loading Enterprise Project Portfolio..." 
        subtitle="Aggregating budget allocations, Jira keys, and cross-project governance"
      />
    );
  }

  return (
    <div className="py-2 space-y-6 max-w-[1600px] mx-auto">
      
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#FF5A14]/15 text-[#FF5A14] border border-[#FF5A14]/30 flex items-center gap-1">
              <FolderKanban size={11} />
              <span>Project Command Hub</span>
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Role: <strong className="text-slate-800 dark:text-white font-semibold">{user?.role}</strong>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black theme-heading tracking-tight">
            Enterprise Projects Portfolio
          </h1>
          <p className="text-xs sm:text-sm theme-muted mt-1">
            Select a project workspace to launch persona telemetry, risk registers, and connector syncs.
          </p>
        </div>

        {/* Right Action: PMO Project Creation Button */}
        <div className="flex items-center gap-3">
          {isPMO ? (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white text-xs font-bold shadow-[0_0_25px_rgba(255,90,20,0.45)] hover:shadow-[0_0_35px_rgba(255,90,20,0.65)] hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer group"
            >
              <Plus size={16} className="group-hover:rotate-90 transition-transform" />
              <span>Create New Project</span>
            </button>
          ) : (
            <div className="text-[11px] px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/5 text-slate-400 font-mono flex items-center gap-1.5">
              <Briefcase size={13} className="text-[#FF7A45]" />
              <span>Project Creation Restricted to PMO</span>
            </div>
          )}
        </div>
      </div>

      {/* Portfolio Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-4 rounded-2xl theme-card flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 rounded-xl bg-[#FF5A14]/15 text-[#FF5A14] border border-[#FF5A14]/30 flex items-center justify-center flex-shrink-0">
            <FolderKanban size={22} />
          </div>
          <div>
            <span className="text-[11px] theme-muted uppercase font-bold tracking-wider block">Total Projects</span>
            <div className="text-2xl font-black theme-heading mt-0.5">{projects.length}</div>
            <span className="text-[10px] text-emerald-400 font-semibold">{activeCount} Active & Governed</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl theme-card flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
            <DollarSign size={22} />
          </div>
          <div>
            <span className="text-[11px] theme-muted uppercase font-bold tracking-wider block">Portfolio Allocation</span>
            <div className="text-2xl font-black theme-heading mt-0.5">
              ${totalAllocation >= 1000000 ? (totalAllocation / 1000000).toFixed(1) + 'M' : (totalAllocation / 1000).toFixed(0) + 'K'}
            </div>
            <span className="text-[10px] theme-muted font-semibold">
              Spent: ${totalSpent >= 1000000 ? (totalSpent / 1000000).toFixed(1) + 'M' : (totalSpent / 1000).toFixed(0) + 'K'}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl theme-card flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 rounded-xl bg-red-500/15 text-red-500 border border-red-500/30 flex items-center justify-center flex-shrink-0">
            <ShieldAlert size={22} />
          </div>
          <div>
            <span className="text-[11px] theme-muted uppercase font-bold tracking-wider block">Critical Risks</span>
            <div className="text-2xl font-black theme-heading mt-0.5">{totalCritRisks}</div>
            <span className={`text-[10px] font-semibold ${totalCritRisks > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {totalCritRisks > 0 ? 'Action Required' : 'All Clear'}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl theme-card flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 rounded-xl bg-blue-500/15 text-blue-500 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
            <Sparkles size={22} />
          </div>
          <div>
            <span className="text-[11px] theme-muted uppercase font-bold tracking-wider block">Enterprise Governance</span>
            <div className="text-2xl font-black theme-heading mt-0.5">100%</div>
            <span className="text-[10px] text-blue-400 font-semibold">Autonomous Copilot Active</span>
          </div>
        </div>

      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-3.5 rounded-2xl theme-card flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by project name, Jira Key (e.g. PRJ-101)..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 focus:border-[#FF5A14] outline-none text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs theme-muted font-semibold hidden md:inline">Filter Status:</span>
          {['All', 'Active', 'On Hold', 'Completed'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === status
                  ? 'bg-[#FF5A14] text-white shadow-md'
                  : 'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/[0.08]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="py-16 text-center theme-card rounded-2xl p-8 border border-dashed border-white/10">
          <FolderKanban className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold theme-heading">No Projects Found</h3>
          <p className="text-xs theme-muted mt-1 max-w-sm mx-auto">
            {searchTerm ? `No project matches search query "${searchTerm}".` : 'No projects are currently registered in the database.'}
          </p>
          {isPMO && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-[#FF5A14] text-white text-xs font-bold shadow-md hover:brightness-110 inline-flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Create First Project</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((proj) => {
            const health = proj.health_score || 90;
            const burnPct = proj.burn_pct || 0;

            return (
              <div
                key={proj.id}
                className="theme-card p-6 rounded-2xl border transition-all duration-300 hover:border-[#FF5A14]/50 hover:shadow-[0_10px_35px_rgba(0,0,0,0.45)] group flex flex-col justify-between relative overflow-hidden"
              >
                
                {/* Ambient Top Glow Line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#FF5A14]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <div>
                  {/* Top Card Row: Jira Key, Status & Actions */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded-lg bg-[#FF5A14]/15 text-[#FF7A45] border border-[#FF5A14]/30 tracking-wider">
                        {proj.jira_key}
                      </span>
                      {isPMO && (
                        <button
                          type="button"
                          onClick={(e) => handleOpenEditModal(proj, e)}
                          className="p-1 rounded-lg text-slate-400 hover:text-[#FF5A14] hover:bg-[#FF5A14]/10 transition-colors cursor-pointer"
                          title="Edit Project Details"
                        >
                          <Edit3 size={13} />
                        </button>
                      )}
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                      proj.status === 'Active' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                      proj.status === 'On Hold' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                      proj.status === 'Completed' ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30' :
                      'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                    }`}>
                      {proj.status || 'Active'}
                    </span>
                  </div>

                  {/* Project Name & Description */}
                  <h3 className="text-lg font-bold theme-heading group-hover:text-[#FF7A45] transition-colors line-clamp-1" title={proj.name}>
                    {proj.name}
                  </h3>
                  <p className="text-xs theme-muted mt-1.5 line-clamp-2 min-h-[32px]">
                    {proj.description || `Enterprise software governance and delivery framework under ${proj.program_name || 'Enterprise Portfolio'}.`}
                  </p>

                  {/* Health Score & Program Info */}
                  <div className="flex items-center justify-between py-3 my-3 border-y border-slate-200 dark:border-white/5 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] theme-muted font-medium">Health Index:</span>
                      <span className={`font-mono font-extrabold px-2 py-0.5 rounded text-[11px] ${
                        health >= 85 ? 'bg-emerald-500/15 text-emerald-400' :
                        health >= 70 ? 'bg-amber-500/15 text-amber-400' : 'bg-red-500/15 text-red-400'
                      }`}>
                        {health}%
                      </span>
                    </div>
                    <span className="text-[11px] theme-muted font-medium truncate max-w-[140px]" title={proj.program_name}>
                      {proj.program_name || 'Enterprise Portfolio'}
                    </span>
                  </div>

                  {/* Budget Allocation Bar */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="theme-muted font-medium">Budget Burn</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-white">{proj.budget_summary || '$0 / $1.0M'}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-black/40 overflow-hidden border border-slate-200 dark:border-white/5">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          burnPct > 90 ? 'bg-red-500' : burnPct > 70 ? 'bg-amber-500' : 'bg-gradient-to-r from-[#FF5A14] to-emerald-400'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(5, burnPct))}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Badges: Risks, Ingestion Docs */}
                  <div className="flex items-center gap-2 text-[11px] font-medium theme-muted mb-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/5">
                      <ShieldAlert size={12} className={proj.critical_risks_count > 0 ? "text-red-400" : "text-slate-400"} />
                      <span>{proj.total_risks_count || 0} Risks</span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/5">
                      <FileText size={12} className="text-blue-400" />
                      <span>{proj.documents_count || 0} Docs</span>
                    </span>
                  </div>
                </div>

                {/* Bottom Card Action: Launch Workspace Button */}
                <button
                  onClick={() => handleOpenWorkspace(proj)}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] hover:brightness-110 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer group-hover:shadow-[0_0_20px_rgba(255,90,20,0.4)]"
                >
                  <span>Launch Workspace</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>

              </div>
            );
          })}
        </div>
      )}

      {/* ==================================================== */}
      {/* PMO ONLY: CREATE NEW PROJECT MODAL DIALOG           */}
      {/* ==================================================== */}
      {isCreateModalOpen && isPMO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
          <div className="max-w-xl w-full bg-white dark:bg-[#131A29] rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-white/15 shadow-[0_25px_80px_rgba(0,0,0,0.25)] dark:shadow-[0_25px_80px_rgba(0,0,0,0.85)] relative overflow-hidden transition-colors">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#FF5A14]/15 text-[#FF5A14] border border-[#FF5A14]/30 flex items-center justify-center">
                  <FolderKanban size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Create Enterprise Project</h3>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">PMO Authorized Action</span>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Project Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    placeholder="e.g., Core Banking Modernization"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0E1422] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-[#FF5A14] focus:ring-1 focus:ring-[#FF5A14] outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Project Code <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    name="jira_key"
                    value={form.jira_key}
                    onChange={handleFormChange}
                    placeholder="Auto (e.g. CBM)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0E1422] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-mono placeholder-slate-400 dark:placeholder-slate-500 focus:border-[#FF5A14] focus:ring-1 focus:ring-[#FF5A14] outline-none uppercase transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Planned Budget ($)</label>
                  <input
                    type="number"
                    name="planned_spend"
                    value={form.planned_spend}
                    onChange={handleFormChange}
                    placeholder="1500000"
                    step="50000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0E1422] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-mono placeholder-slate-400 dark:placeholder-slate-500 focus:border-[#FF5A14] focus:ring-1 focus:ring-[#FF5A14] outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Initial Status</label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleFormChange}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0E1422] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-[#FF5A14] focus:ring-1 focus:ring-[#FF5A14] outline-none transition-all cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Planning">Planning</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  rows={3}
                  placeholder="High-level objectives, architectural scope, and delivery milestones..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0E1422] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-[#FF5A14] focus:ring-1 focus:ring-[#FF5A14] outline-none transition-all resize-none"
                />
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] hover:brightness-110 text-white text-xs font-bold flex items-center gap-2 shadow-lg disabled:opacity-50 transition-all cursor-pointer"
                >
                  {submitting ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                  <span>{submitting ? 'Creating Project...' : 'Initialize Project'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* PMO ONLY: EDIT PROJECT MODAL DIALOG                 */}
      {/* ==================================================== */}
      {isEditModalOpen && isPMO && editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
          <div className="max-w-xl w-full bg-white dark:bg-[#131A29] rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-white/15 shadow-[0_25px_80px_rgba(0,0,0,0.25)] dark:shadow-[0_25px_80px_rgba(0,0,0,0.85)] relative overflow-hidden transition-colors">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#FF5A14]/15 text-[#FF5A14] border border-[#FF5A14]/30 flex items-center justify-center">
                  <Edit3 size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Edit Project Settings</h3>
                  <span className="text-[11px] text-[#FF5A14] font-mono font-semibold">
                    Identifier: {editingProject.jira_key}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Project Name *</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="e.g., Core Banking Modernization"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0E1422] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-[#FF5A14] focus:ring-1 focus:ring-[#FF5A14] outline-none transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Planned Budget ($)</label>
                  <input
                    type="number"
                    value={editForm.planned_spend}
                    onChange={(e) => setEditForm({ ...editForm, planned_spend: e.target.value })}
                    placeholder="1500000"
                    step="50000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0E1422] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-mono placeholder-slate-400 dark:placeholder-slate-500 focus:border-[#FF5A14] focus:ring-1 focus:ring-[#FF5A14] outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Project Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0E1422] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-[#FF5A14] focus:ring-1 focus:ring-[#FF5A14] outline-none transition-all cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Planning">Planning</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  placeholder="High-level objectives, architectural scope, and delivery milestones..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0E1422] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-[#FF5A14] focus:ring-1 focus:ring-[#FF5A14] outline-none transition-all resize-none"
                />
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] hover:brightness-110 text-white text-xs font-bold flex items-center gap-2 shadow-lg disabled:opacity-50 transition-all cursor-pointer"
                >
                  {submitting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  <span>{submitting ? 'Updating Project...' : 'Save Changes'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProjectsPage;
