import React, { useState, useEffect } from 'react';
import RiskRegisterTable from '../components/risks/RiskRegisterTable';
import { risksApi } from '../api/risksApi';
import { useToast } from '../context/ToastContext';
import { useProject } from '../context/ProjectContext';
import FuturisticLoader from '../components/common/FuturisticLoader';
import { PlusCircle, ShieldAlert, CheckCircle, RefreshCw, FolderKanban } from 'lucide-react';

const RiskRegisterPage = () => {
  const { activeProject } = useProject();
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const { showToast } = useToast();

  const [newRisk, setNewRisk] = useState({
    title: '',
    severity: 'High',
    status: 'Open',
    owner: 'Unassigned',
    description: '',
    mitigation_plan: ''
  });

  const fetchRisks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await risksApi.getRisks(activeProject?.id || activeProject?.jira_key);
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
  }, [activeProject?.id]);

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
      const res = await risksApi.createRisk({
        ...newRisk,
        project_id: activeProject?.id
      });
      if (res.success && res.risk) {
        setRisks(prev => [res.risk, ...prev]);
        setShowAddModal(false);
        setNewRisk({
          title: '',
          severity: 'High',
          status: 'Open',
          owner: 'Unassigned',
          description: '',
          mitigation_plan: ''
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

  if (loading) {
    return (
      <FuturisticLoader 
        title="Loading Autonomous Risk Register..." 
        subtitle="Aggregating cross-program delivery bottlenecks and severity scores"
      />
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="p-6 rounded-2xl theme-card border-red-500/40 text-center max-w-xl mx-auto">
          <h3 className="text-sm font-bold text-red-500">Error Loading Risks</h3>
          <p className="mt-2 text-xs theme-muted">{error}</p>
          <button
            onClick={fetchRisks}
            className="mt-4 px-4 py-2 bg-[#FF5A14] text-white rounded-xl text-xs font-bold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const criticalCount = risks.filter(r => r.severity === 'Critical' && r.status === 'Open').length;
  const mitigatedCount = risks.filter(r => r.status === 'Mitigated').length;
  const closedCount = risks.filter(r => r.status === 'Closed').length;

  return (
    <div className="py-2 space-y-6">
      {/* Header and Stats */}
      <div className="pb-4 border-b theme-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black theme-heading tracking-tight">Program Risk Register</h1>
          <p className="text-xs sm:text-sm theme-muted mt-1">
            Autonomous multi-tier risk intelligence with Tree-of-Thoughts mitigation planning and live ownership assignment.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] hover:brightness-110 text-white rounded-xl text-xs font-bold shadow-md transition-all"
          >
            <PlusCircle size={15} />
            <span>Register New Risk</span>
          </button>

          <button
            onClick={fetchRisks}
            title="Refresh risks from DB"
            className="p-2.5 theme-card rounded-xl border theme-border theme-heading hover:text-[#FF5A14] transition-colors"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl theme-card border theme-border flex items-center gap-3">
          <div className="p-3 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20">
            <ShieldAlert size={20} />
          </div>
          <div>
            <div className="text-xl font-black theme-heading">{criticalCount}</div>
            <div className="text-xs theme-muted">Critical Open Blockers</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl theme-card border theme-border flex items-center gap-3">
          <div className="p-3 bg-sky-500/10 text-sky-500 rounded-xl border border-sky-500/20">
            <RefreshCw size={20} />
          </div>
          <div>
            <div className="text-xl font-black theme-heading">{mitigatedCount}</div>
            <div className="text-xs theme-muted">Mitigated / In Review</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl theme-card border theme-border flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20">
            <CheckCircle size={20} />
          </div>
          <div>
            <div className="text-xl font-black theme-heading">{closedCount}</div>
            <div className="text-xs theme-muted">Resolved & Closed</div>
          </div>
        </div>
      </div>
      
      <RiskRegisterTable 
        risks={risks} 
        onUpdateRisk={handleUpdateRisk}
        onRiskUpdated={handleRiskUpdated}
      />

      {/* Add Risk Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="theme-card border theme-border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b theme-border">
              <h3 className="text-base font-bold theme-heading">Log New Program Risk</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-lg cursor-pointer leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRisk} className="space-y-4">
              <div>
                <label className="block text-xs font-bold theme-heading mb-1">Risk Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Core Database Replication Latency Spike"
                  value={newRisk.title}
                  onChange={(e) => setNewRisk(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 text-xs theme-input rounded-xl focus:outline-none focus:border-[#FF5A14]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold theme-heading mb-1">Severity</label>
                  <select
                    value={newRisk.severity}
                    onChange={(e) => setNewRisk(prev => ({ ...prev, severity: e.target.value }))}
                    className="w-full px-3 py-2 text-xs theme-input rounded-xl focus:outline-none focus:border-[#FF5A14]"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold theme-heading mb-1">Owner</label>
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
              </div>

              <div>
                <label className="block text-xs font-bold theme-heading mb-1">Risk Description</label>
                <textarea
                  rows={2}
                  placeholder="Detailed root cause or operational impact..."
                  value={newRisk.description}
                  onChange={(e) => setNewRisk(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 text-xs theme-input rounded-xl focus:outline-none focus:border-[#FF5A14]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold theme-heading mb-1">Mitigation Plan</label>
                <textarea
                  rows={2}
                  placeholder="Recommended containment action or fallback path..."
                  value={newRisk.mitigation_plan}
                  onChange={(e) => setNewRisk(prev => ({ ...prev, mitigation_plan: e.target.value }))}
                  className="w-full px-3 py-2 text-xs theme-input rounded-xl focus:outline-none focus:border-[#FF5A14]"
                />
              </div>

              <div className="pt-3 border-t theme-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white rounded-xl text-xs font-bold shadow hover:brightness-110 disabled:opacity-50"
                >
                  {creating ? 'Registering...' : 'Register Risk'}
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
