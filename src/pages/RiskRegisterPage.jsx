import React, { useState, useEffect } from 'react';
import RiskRegisterTable from '../components/risks/RiskRegisterTable';
import { risksApi } from '../api/risksApi';
import { useToast } from '../context/ToastContext';
import { useProject } from '../context/ProjectContext';
import FuturisticLoader from '../components/common/FuturisticLoader';
import { 
  PlusCircle, ShieldAlert, CheckCircle, RefreshCw, FolderKanban, 
  AlertTriangle, Sparkles, Activity, Clock, ShieldCheck, Layers 
} from 'lucide-react';

const CATEGORY_CHOICES = [
  'Architecture & Tech',
  'Security & Compliance',
  'Infrastructure & Cloud',
  'Vendor & SLA',
  'Financial & Budget',
  'Delivery & Schedule'
];

const RiskRegisterPage = () => {
  const { activeProject, projects } = useProject();
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const { showToast } = useToast();

  const isAllProjects = !activeProject || activeProject.id === 'all' || activeProject.jira_key === 'ALL';

  const [newRisk, setNewRisk] = useState({
    title: '',
    severity: 'High',
    status: 'Open',
    category: 'Architecture & Tech',
    owner: 'Unassigned',
    description: '',
    mitigation_plan: '',
    project_id: ''
  });

  const fetchRisks = async () => {
    try {
      setLoading(true);
      setError(null);
      const targetParam = isAllProjects ? 'all' : (activeProject?.id || activeProject?.jira_key || 'all');
      const data = await risksApi.getRisks(targetParam);
      setRisks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch risks", err);
      setError("Unable to load risk register data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRisks();
  }, [activeProject?.id, activeProject?.jira_key]);

  const handleUpdateRisk = async (id, updates) => {
    // Optimistic update
    const previous = [...risks];
    setRisks(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));

    try {
      const res = await risksApi.updateRisk(id, updates);
      if (res.success && res.risk) {
        setRisks(prev => prev.map(r => r.id === id ? res.risk : r));
        showToast(`Risk ${res.risk.risk_id} updated successfully!`, "success");
      }
    } catch (err) {
      console.error("Failed to update risk:", err);
      setRisks(previous);
      showToast("Failed to update risk.", "error");
    }
  };

  const handleRiskUpdated = (updatedRisk) => {
    if (!updatedRisk) return;
    setRisks(prev => prev.map(r => r.id === updatedRisk.id ? updatedRisk : r));
  };

  const handleCreateRisk = async (e) => {
    e.preventDefault();
    if (!newRisk.title.trim()) {
      showToast("Risk title is required.", "warning");
      return;
    }

    try {
      setCreating(true);
      const chosenProjectId = newRisk.project_id || (!isAllProjects ? activeProject?.id : (projects[0]?.id || 1));
      const res = await risksApi.createRisk({
        ...newRisk,
        project_id: chosenProjectId
      });
      if (res.success && res.risk) {
        setRisks(prev => [res.risk, ...prev]);
        setShowAddModal(false);
        setNewRisk({
          title: '',
          severity: 'High',
          status: 'Open',
          category: 'Architecture & Tech',
          owner: 'Unassigned',
          description: '',
          mitigation_plan: '',
          project_id: ''
        });
        showToast(`New risk ${res.risk.risk_id} registered!`, "success");
      }
    } catch (err) {
      console.error("Failed to create risk:", err);
      showToast("Failed to create risk.", "error");
    } finally {
      setCreating(false);
    }
  };

  if (loading && risks.length === 0) {
    return (
      <FuturisticLoader 
        title="Synchronizing Risk Intelligence..." 
        subtitle="Aggregating multi-tier architectural, vendor SLA, and financial risk profiles"
      />
    );
  }

  if (error && risks.length === 0) {
    return (
      <div className="p-8">
        <div className="p-6 rounded-2xl theme-card border-red-500/40 text-center max-w-xl mx-auto">
          <h3 className="text-sm font-bold text-red-500">Error Loading Risks</h3>
          <p className="mt-2 text-xs theme-muted">{error}</p>
          <button
            onClick={fetchRisks}
            className="mt-4 px-4 py-2 bg-[#FF5A14] text-white rounded-xl text-xs font-bold shadow-md hover:brightness-110"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const criticalCount = risks.filter(r => r.severity === 'Critical' && (r.status === 'Open' || !r.status)).length;
  const highCount = risks.filter(r => r.severity === 'High' && (r.status === 'Open' || !r.status)).length;
  const mitigatedCount = risks.filter(r => r.status === 'Mitigated').length;
  const closedCount = risks.filter(r => r.status === 'Closed').length;

  return (
    <div className="py-2 space-y-6">
      
      {/* Top Header */}
      <div className="pb-4 border-b theme-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#FF5A14]/15 text-[#FF5A14] border border-[#FF5A14]/30">
              Enterprise Risk Governance
            </span>
            <span className="text-xs theme-muted font-mono">
              Live Monitored: {risks.length} Registered Risks
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black theme-heading tracking-tight">
            Program Risk Register
          </h1>
          <p className="text-xs sm:text-sm theme-muted mt-0.5">
            {isAllProjects 
              ? 'Showing all enterprise projects divided project-wise. (Select a specific project from the header above to filter)' 
              : `Showing risk intelligence for [${activeProject?.jira_key}] ${activeProject?.name}. Managed centrally from header.`}
          </p>
        </div>

        {/* Right Controls: Header Project Indicator + Log Risk + Refresh */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Header Context Indicator */}
          <div className="px-3 py-1.5 rounded-xl theme-card border theme-border flex items-center gap-2 text-xs font-semibold shadow-sm">
            <FolderKanban size={14} className="text-[#FF5A14]" />
            <span className="theme-muted hidden sm:inline">Active Scope:</span>
            <span className="font-mono text-[#FF7A45] font-extrabold">
              {isAllProjects ? '[ALL] All Projects' : `[${activeProject?.jira_key}] ${activeProject?.name}`}
            </span>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] hover:brightness-110 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            <PlusCircle size={15} />
            <span>Log Risk</span>
          </button>

          <button
            onClick={fetchRisks}
            title="Refresh risks from DB"
            className="p-2 theme-card rounded-xl border theme-border theme-heading hover:text-[#FF5A14] transition-colors cursor-pointer"
          >
            <RefreshCw size={15} className={loading ? "animate-spin text-[#FF5A14]" : ""} />
          </button>
        </div>
      </div>

      {/* AI Risk Advisory Banner */}
      <div className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
        criticalCount > 0 
          ? 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-200' 
          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
      }`}>
        <div className={`p-2 rounded-xl flex-shrink-0 mt-0.5 ${
          criticalCount > 0 ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
        }`}>
          {criticalCount > 0 ? <AlertTriangle size={18} /> : <ShieldCheck size={18} />}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-xs sm:text-sm font-bold theme-heading">
              {criticalCount > 0 
                ? `Autonomous Risk Sentinel: ${criticalCount} Critical Showstopper(s) Active`
                : 'Risk Posture Governed: Stable Trajectory Across Monitored Sprints'}
            </h4>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/20 font-extrabold tracking-wider">
              {isAllProjects ? 'PORTFOLIO SCOPE' : `PROJECT [${activeProject?.jira_key || 'ACTIVE'}]`}
            </span>
          </div>
          <p className="text-xs mt-1 leading-relaxed theme-muted font-medium">
            {criticalCount > 0 
              ? `Critical delivery threats detected in API contracts or infrastructure replication. Autonomous capital release gates require assigned lead architect remediation sign-off before subsequent milestone disbursements.`
              : 'All registered workstreams are actively governed within baseline contractual variance. Zero blockers currently restricting capital disbursements.'}
          </p>
        </div>
      </div>

      {/* 4 User-Friendly KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Critical Blockers */}
        <div className="p-4 rounded-2xl theme-card border border-white/10 hover:border-red-500/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider theme-muted">
              Critical Showstoppers
            </span>
            <div className="p-2 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
              <ShieldAlert size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-red-500 mb-1">
            {criticalCount}
          </div>
          <div className="text-[11px] theme-muted font-medium">
            Halts release gates & capital disbursement
          </div>
        </div>

        {/* Card 2: High Attention */}
        <div className="p-4 rounded-2xl theme-card border border-white/10 hover:border-amber-500/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider theme-muted">
              High Attention
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-500 mb-1">
            {highCount}
          </div>
          <div className="text-[11px] theme-muted font-medium">
            Active architectural, vendor & security threats
          </div>
        </div>

        {/* Card 3: Mitigated / In Progress */}
        <div className="p-4 rounded-2xl theme-card border border-white/10 hover:border-sky-500/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider theme-muted">
              Mitigated / Controlled
            </span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500 border border-sky-500/20">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-sky-500 mb-1">
            {mitigatedCount}
          </div>
          <div className="text-[11px] theme-muted font-medium">
            Containment actions executed & monitored
          </div>
        </div>

        {/* Card 4: Resolved & Closed */}
        <div className="p-4 rounded-2xl theme-card border border-white/10 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider theme-muted">
              Resolved & Closed
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <CheckCircle size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-500 mb-1">
            {closedCount}
          </div>
          <div className="text-[11px] theme-muted font-medium">
            Verified and safely closed in past sprints
          </div>
        </div>

      </div>
      
      {/* Enhanced Interactive Risk Register Table */}
      <RiskRegisterTable 
        risks={risks} 
        activeProject={activeProject}
        onUpdateRisk={handleUpdateRisk}
        onRiskUpdated={handleRiskUpdated}
      />

      {/* Log New Risk Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="theme-card border theme-border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b theme-border">
              <div>
                <h3 className="text-base font-bold theme-heading">Log New Program Risk</h3>
                <span className="text-xs theme-muted">Add a clearly understood threat with root cause and mitigation</span>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-lg cursor-pointer leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRisk} className="space-y-4">
              <div>
                <label className="block text-xs font-bold theme-heading mb-1">Target Project</label>
                <select
                  value={newRisk.project_id || (!isAllProjects ? activeProject?.id : (projects[0]?.id || 1))}
                  onChange={(e) => setNewRisk(prev => ({ ...prev, project_id: e.target.value }))}
                  className="w-full px-3 py-2 text-xs theme-input rounded-xl focus:outline-none focus:border-[#FF5A14]"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>[{p.jira_key}] {p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold theme-heading mb-1">Risk Title (Clear & Meaningful)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cross-Region Database Replication Latency Exceeding SLA"
                  value={newRisk.title}
                  onChange={(e) => setNewRisk(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 text-xs theme-input rounded-xl focus:outline-none focus:border-[#FF5A14]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold theme-heading mb-1">Category</label>
                  <select
                    value={newRisk.category}
                    onChange={(e) => setNewRisk(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 text-xs theme-input rounded-xl focus:outline-none focus:border-[#FF5A14]"
                  >
                    {CATEGORY_CHOICES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold theme-heading mb-1">Severity</label>
                  <select
                    value={newRisk.severity}
                    onChange={(e) => setNewRisk(prev => ({ ...prev, severity: e.target.value }))}
                    className="w-full px-3 py-2 text-xs theme-input rounded-xl focus:outline-none focus:border-[#FF5A14]"
                  >
                    <option value="Critical">Critical (Halts Gates)</option>
                    <option value="High">High (High Attention)</option>
                    <option value="Medium">Medium (Moderate Exposure)</option>
                    <option value="Low">Low (Low Impact)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold theme-heading mb-1">Assigned Owner</label>
                  <select
                    value={newRisk.owner}
                    onChange={(e) => setNewRisk(prev => ({ ...prev, owner: e.target.value }))}
                    className="w-full px-3 py-2 text-xs theme-input rounded-xl focus:outline-none focus:border-[#FF5A14]"
                  >
                    <option value="Unassigned">Unassigned</option>
                    <option value="Lead Cloud Architect">Lead Cloud Architect</option>
                    <option value="Chief InfoSec Officer">Chief InfoSec Officer</option>
                    <option value="PMO Program Director">PMO Program Director</option>
                    <option value="Vendor Delivery Head">Vendor Delivery Head</option>
                    <option value="Financial Controller">Financial Controller</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold theme-heading mb-1">Status</label>
                  <select
                    value={newRisk.status}
                    onChange={(e) => setNewRisk(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 text-xs theme-input rounded-xl focus:outline-none focus:border-[#FF5A14]"
                  >
                    <option value="Open">Open</option>
                    <option value="Mitigated">Mitigated</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold theme-heading mb-1">Problem Description (Root Cause & Impact)</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Describe what is causing the risk and its concrete business or delivery impact..."
                  value={newRisk.description}
                  onChange={(e) => setNewRisk(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 text-xs theme-input rounded-xl focus:outline-none focus:border-[#FF5A14]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold theme-heading mb-1">Mitigation Action Plan</label>
                <textarea
                  rows={2}
                  placeholder="Concrete steps and technical safeguards to eliminate or contain the risk..."
                  value={newRisk.mitigation_plan}
                  onChange={(e) => setNewRisk(prev => ({ ...prev, mitigation_plan: e.target.value }))}
                  className="w-full px-3 py-2 text-xs theme-input rounded-xl focus:outline-none focus:border-[#FF5A14]"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t theme-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl theme-card border theme-border text-xs font-semibold theme-muted hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white rounded-xl text-xs font-bold shadow-md hover:brightness-110 disabled:opacity-50 transition-all"
                >
                  {creating ? "Logging..." : "Confirm & Register"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default RiskRegisterPage;
