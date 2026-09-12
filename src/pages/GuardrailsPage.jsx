import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useProject } from '../context/ProjectContext';
import { guardrailsApi } from '../api/guardrailsApi';
import { 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  ExternalLink,
  Plus,
  Trash2,
  Search,
  Filter,
  Sparkles,
  X,
  Layers,
  Sliders,
  Check,
  RotateCw,
  ChevronDown,
  ChevronUp,
  Cpu,
  FolderKanban,
  Edit3
} from 'lucide-react';
import FuturisticLoader from '../components/common/FuturisticLoader';

const QUICK_TEMPLATES = [
  {
    name: 'PII & Secret Redaction Filter',
    category: 'Security & PII',
    level: 'Strict',
    description: 'Scans and redacts sensitive credentials, passwords, API tokens, and personally identifiable info before model synthesis.'
  },
  {
    name: 'LLM Hallucination Cutoff (<80%)',
    category: 'Safety & Format',
    level: 'High',
    description: 'Rejects confidence ratings below 80% and activates autonomous retrieval augmentation fallback.'
  },
  {
    name: 'SOW Budget Variance Deviation (>15%)',
    category: 'Financial Controls',
    level: 'Warning',
    description: 'Flags immediate PMO alert if sprint expenditure outpaces allocated tranche baseline by more than 15%.'
  },
  {
    name: 'Vendor SLA Breach Quarantine',
    category: 'Human-in-the-Loop',
    level: 'Strict',
    description: 'Halts non-compliant deliverable approvals and mandates verified officer sign-off before milestone release.'
  }
];

const CATEGORIES = [
  'All',
  'Data Integrity',
  'Safety & Format',
  'Human-in-the-Loop',
  'Financial Controls',
  'Security & PII',
  'Vendor Compliance',
  'Custom Policy'
];

const GuardrailsPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { activeProject } = useProject();
  const [guardrailsData, setGuardrailsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // New & Edit Guardrail Modal & Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [newPolicy, setNewPolicy] = useState({
    name: '',
    category: 'Security & PII',
    level: 'Strict',
    description: '',
    status: 'Active',
    scope: 'project'
  });

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [levelFilter, setLevelFilter] = useState('All');
  const [scopeFilter, setScopeFilter] = useState('All'); // 'All', 'Project', 'Global'

  // Dynamic AI Suggestions State
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const fetchAiSuggestions = async (refresh = false) => {
    try {
      setAiLoading(true);
      const pid = activeProject?.id || 1;
      const res = await guardrailsApi.getSuggestions(pid, refresh);
      if (res && res.suggestions && res.suggestions.length > 0) {
        setAiSuggestions(res.suggestions);
      }
    } catch (err) {
      console.error("Failed to fetch AI suggestions:", err);
    } finally {
      setAiLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await guardrailsApi.getGuardrails(activeProject?.id);
      setGuardrailsData(res);
    } catch (err) {
      console.error("Failed to fetch guardrails:", err);
      setError("Failed to connect to the guardrails service.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchAiSuggestions();
  }, [activeProject?.id]);

  useEffect(() => {
    if (showAddModal && !editingPolicy && aiSuggestions.length === 0) {
      fetchAiSuggestions();
    }
  }, [showAddModal, editingPolicy]);

  const handleOpenEditPolicy = (policy) => {
    setEditingPolicy(policy);
    setNewPolicy({
      name: policy.name || '',
      category: policy.category || 'Security & PII',
      level: policy.level || 'Strict',
      description: policy.description || '',
      status: policy.status || 'Active',
      scope: policy.is_global ? 'global' : 'project'
    });
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingPolicy(null);
    setNewPolicy({
      name: '',
      category: 'Security & PII',
      level: 'Strict',
      description: '',
      status: 'Active',
      scope: 'project'
    });
  };

  const handleResolve = async (itemId, decision) => {
    try {
      setActionLoading(itemId);
      const res = await guardrailsApi.resolveQueueItem(itemId, decision, `Resolved as ${decision} by ${user?.name || user?.email || 'Officer'}`);
      if (decision === 'Approved' && res?.jira?.key) {
        showToast(`Item #${itemId} approved! Raised Jira ticket: ${res.jira.key}`, 'success');
      } else {
        showToast(`Item #${itemId} marked as ${decision}`, 'success');
      }
      await fetchData();
    } catch (err) {
      console.error("Resolution failed:", err);
      const msg = err.response?.data?.error || "Resolution failed. Please verify your session.";
      showToast(msg, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmitPolicy = async (e) => {
    e.preventDefault();
    if (!newPolicy.name.trim()) {
      showToast("Policy name is required", "error");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: newPolicy.name.trim(),
        category: newPolicy.category.trim(),
        level: newPolicy.level,
        description: newPolicy.description.trim(),
        status: newPolicy.status,
        project_id: newPolicy.scope === 'global' ? null : (activeProject?.id || 1)
      };

      if (editingPolicy) {
        await guardrailsApi.updatePolicy(editingPolicy.id, payload);
        showToast(`Guardrail "${newPolicy.name}" updated successfully!`, 'success');
      } else {
        const res = await guardrailsApi.createPolicy(payload);
        const scopeLabel = newPolicy.scope === 'global' ? 'Global Standard' : `Project [${activeProject?.jira_key || 'PRJ'}]`;
        showToast(`Guardrail "${res.policy?.name || newPolicy.name}" deployed (${scopeLabel})!`, 'success');
      }

      handleCloseModal();
      await fetchData();
    } catch (err) {
      console.error("Failed to save policy:", err);
      const msg = err.response?.data?.error || "Failed to save guardrail policy.";
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };


  const handleTogglePolicy = async (policyId) => {
    try {
      // Optimistic update
      setGuardrailsData(prev => {
        if (!prev) return prev;
        const updated = (prev.policies || []).map(p => {
          if (p.id === policyId || p.numeric_id === policyId) {
            return { ...p, status: p.status === 'Active' ? 'Inactive' : 'Active' };
          }
          return p;
        });
        return { ...prev, policies: updated };
      });

      const res = await guardrailsApi.togglePolicy(policyId);
      const newStatus = res.policy?.status || "updated";
      showToast(`Guardrail ${policyId} is now ${newStatus}`, 'success');
      await fetchData();
    } catch (err) {
      console.error("Failed to toggle policy:", err);
      showToast("Failed to toggle guardrail status", "error");
      await fetchData();
    }
  };

  const handleDeletePolicy = async (policyId) => {
    if (!window.confirm(`Are you sure you want to remove guardrail policy ${policyId}?`)) {
      return;
    }

    try {
      await guardrailsApi.deletePolicy(policyId);
      showToast(`Policy ${policyId} removed`, 'success');
      await fetchData();
    } catch (err) {
      console.error("Failed to delete policy:", err);
      showToast("Failed to delete policy", "error");
    }
  };

  const applyTemplate = (tpl) => {
    setNewPolicy(prev => ({
      ...prev,
      name: tpl.name,
      category: tpl.category,
      level: tpl.level,
      description: tpl.description,
      status: 'Active'
    }));
  };

  if (loading) {
    return (
      <FuturisticLoader 
        title="Checking Compliance Guardrails & Oversight..." 
        subtitle="Auditing AI outputs against safety constraints, hallucination thresholds, and PII policies"
      />
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="p-6 rounded-2xl theme-card border-red-500/40 text-center max-w-xl mx-auto">
          <h3 className="text-sm font-bold text-red-500">Error Loading Guardrails</h3>
          <p className="mt-2 text-xs theme-muted">{error}</p>
        </div>
      </div>
    );
  }

  const policies = guardrailsData?.policies || [];
  const approvalQueue = guardrailsData?.approval_queue || [];
  const stats = guardrailsData?.stats || { 
    active_policies: policies.filter(p => p.status === 'Active').length, 
    project_policies_count: policies.filter(p => !p.is_global).length,
    global_policies_count: policies.filter(p => p.is_global).length,
    pending_approvals: approvalQueue.filter(q => q.status === 'Pending').length 
  };

  // Filtered policies based on search and dropdowns
  const filteredPolicies = policies.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || 
      p.name?.toLowerCase().includes(q) ||
      p.id?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q);
    const matchesCat = categoryFilter === 'All' || p.category === categoryFilter;
    const matchesLevel = levelFilter === 'All' || p.level === levelFilter;
    const matchesScope = scopeFilter === 'All' || 
      (scopeFilter === 'Project' && !p.is_global) || 
      (scopeFilter === 'Global' && p.is_global);
    return matchesSearch && matchesCat && matchesLevel && matchesScope;
  });

  return (
    <div className="py-2 h-full flex flex-col space-y-8">
      {/* Header Section */}
      <div className="pb-4 border-b theme-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#FF5A14]/15 text-[#FF5A14] border border-[#FF5A14]/30 flex items-center gap-1">
              <FolderKanban size={11} />
              <span>[{activeProject?.jira_key || 'PRJ'}] {activeProject?.name || 'All Projects'}</span>
            </span>
            <span className="text-xs theme-muted font-mono">• Autonomous Policy Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black theme-heading tracking-tight">Guardrails &amp; Human Oversight</h1>
          <p className="text-xs sm:text-sm theme-muted mt-1">
            Configure active AI safety constraints, PII redaction filters, and human approval gates for {activeProject?.name || 'enterprise portfolio'}.
          </p>
        </div>

        {/* Action Button to Add New Guardrail */}
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] hover:brightness-110 text-white rounded-xl text-xs font-bold shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Add Guardrail Policy</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="theme-card p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl border border-blue-500/20">
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="text-2xl font-black theme-heading">
              {policies.filter(p => p.status === 'Active').length}
              <span className="text-xs font-normal theme-muted ml-1.5">/ {policies.length} total</span>
            </div>
            <div className="text-[11px] font-bold theme-muted uppercase tracking-wider mt-0.5 flex items-center gap-1.5">
              <span>Active Policies</span>
              <span className="text-[10px] text-slate-400 lowercase font-normal">
                ({stats.project_policies_count || 0} project, {stats.global_policies_count || 0} global)
              </span>
            </div>
          </div>
        </div>

        <div className="theme-card p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20">
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-amber-500">{stats.pending_approvals}</div>
            <div className="text-[11px] font-bold theme-muted uppercase tracking-wider mt-0.5">Pending Human Review</div>
          </div>
        </div>

        <div className="theme-card p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20">
            <CheckCircle size={24} />
          </div>
          <div>
            <div className="text-2xl font-black theme-heading">100%</div>
            <div className="text-[11px] font-bold theme-muted uppercase tracking-wider mt-0.5">Compliance &amp; Audit Coverage</div>
          </div>
        </div>
      </div>

      {/* Active Policies Management Section */}
      <div className="theme-card rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-base font-bold theme-heading flex items-center gap-2">
              <ShieldCheck className="text-[#FF5A14]" size={20} />
              <span>Active Agent Policies &amp; Safety Constraints</span>
            </h2>
            <p className="text-xs theme-muted mt-0.5">Real-time enforcement triggers for Pydantic input/output schemas and model invocations.</p>
          </div>

          {/* Quick Search & Filter Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search policies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl text-xs theme-card border theme-border focus:outline-none focus:border-[#FF5A14] w-36 sm:w-48"
              />
            </div>

            {/* Scope Filter */}
            <select
              value={scopeFilter}
              onChange={(e) => setScopeFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl text-xs theme-card border theme-border focus:outline-none focus:border-[#FF5A14]"
            >
              <option value="All">All Scopes ({policies.length})</option>
              <option value="Project">Project Scoped ({policies.filter(p => !p.is_global).length})</option>
              <option value="Global">Enterprise Global ({policies.filter(p => p.is_global).length})</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl text-xs theme-card border theme-border focus:outline-none focus:border-[#FF5A14]"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
              ))}
            </select>

            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl text-xs theme-card border theme-border focus:outline-none focus:border-[#FF5A14]"
            >
              <option value="All">All Levels</option>
              <option value="Strict">Strict</option>
              <option value="High">High</option>
              <option value="Warning">Warning</option>
              <option value="Medium">Medium</option>
            </select>
          </div>
        </div>

        {/* Policies Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="uppercase tracking-wider border-b border-slate-200 dark:border-white/10 theme-muted font-bold">
              <tr>
                <th className="py-3 px-4">Policy ID</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Scope</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Constraint Rule</th>
                <th className="py-3 px-4">Enforcement</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y theme-border">
              {filteredPolicies.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-xs theme-muted">
                    No policies matched your current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredPolicies.map((p) => {
                  const isActive = p.status === 'Active';
                  return (
                    <tr key={p.id} className="theme-subtle-hover transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#FF5A14] whitespace-nowrap">
                        {p.id}
                      </td>
                      <td className="py-3 px-4 font-bold theme-heading whitespace-nowrap">
                        {p.name}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {p.is_global ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                            <span>🌐 Global</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FF5A14]/15 text-[#FF5A14] border border-[#FF5A14]/30">
                            <FolderKanban size={10} />
                            <span>[{activeProject?.jira_key || 'PRJ'}] Scoped</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium font-mono theme-badge">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 theme-heading leading-relaxed max-w-sm">
                        {p.description}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          p.level === 'Strict' 
                            ? 'bg-red-500/15 text-red-500 border border-red-500/30' 
                            : p.level === 'High'
                            ? 'bg-orange-500/15 text-orange-500 border border-orange-500/30'
                            : p.level === 'Warning'
                            ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                            : 'bg-blue-500/15 text-blue-500 border border-blue-500/30'
                        }`}>
                          {p.level}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleTogglePolicy(p.id)}
                            title={`Click to ${isActive ? 'Deactivate' : 'Activate'}`}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                              isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                            }`}
                          >
                            <span
                              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                isActive ? 'translate-x-4' : 'translate-x-1'
                              }`}
                            />
                          </button>
                          <span className={`text-[11px] font-bold ${isActive ? 'text-emerald-500' : 'text-slate-400'}`}>
                            {isActive ? 'Active' : 'Disabled'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditPolicy(p)}
                            className="p-1.5 text-slate-400 hover:text-[#FF5A14] hover:bg-[#FF5A14]/10 rounded-lg transition-colors cursor-pointer"
                            title="Edit Guardrail Rule"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePolicy(p.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Delete Guardrail Rule"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

          </table>
        </div>
      </div>

      {/* Human-in-the-loop Approval Queue */}
      <div className="theme-card rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-base font-bold theme-heading flex items-center gap-2">
              <ShieldAlert className="text-[#FF5A14]" size={20} />
              <span>Human-in-the-Loop Escalation Queue</span>
            </h2>
            <p className="text-xs theme-muted mt-0.5">High-impact actions halted by policy triggers awaiting authorized officer sign-off.</p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full theme-badge">
            {approvalQueue.length} total items
          </span>
        </div>

        {approvalQueue.length === 0 ? (
          <div className="text-center py-10 border border-dashed theme-border rounded-2xl">
            <CheckCircle className="mx-auto text-emerald-500 mb-2" size={32} />
            <p className="theme-heading font-bold text-sm">All Escalations Resolved</p>
            <p className="text-xs theme-muted mt-1">No items currently require human operator intervention for {activeProject?.name || 'this project'}.</p>
          </div>
        ) : (
          <div className="divide-y theme-border">
            {approvalQueue.map((item) => (
              <div key={item.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold theme-heading text-sm">{item.action_type}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      item.status === 'Pending' ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30' :
                      item.status === 'Approved' ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30' : 
                      'bg-red-500/15 text-red-500 border border-red-500/30'
                    }`}>
                      {item.status}
                    </span>

                    {item.payload?.jira_issue_key && (
                      <a
                        href={item.payload.jira_url || `https://dipakkrsaha44.atlassian.net/browse/${item.payload.jira_issue_key}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-500 border border-blue-500/30 hover:bg-blue-500/25 transition-all shadow-sm"
                        title="View issue on Jira Cloud"
                      >
                        <ExternalLink size={10} />
                        <span>Jira: {item.payload.jira_issue_key}</span>
                      </a>
                    )}
                  </div>
                  <p className="text-xs theme-muted">{item.reasoning || 'Automated escalation flag'}</p>
                  <div className="text-[11px] theme-muted flex items-center gap-1 mt-1 font-mono">
                    <Clock size={12} />
                    Created: {item.created_at ? new Date(item.created_at).toLocaleString() : 'Recent'}
                  </div>
                </div>

                {item.status === 'Pending' && ['PMO', 'Program Director', 'Project Manager', 'Admin'].includes(user?.role) && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleResolve(item.id, 'Approved')}
                      disabled={actionLoading === item.id}
                      className="flex items-center gap-1 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 shadow-sm"
                    >
                      <CheckCircle size={14} /> Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResolve(item.id, 'Rejected')}
                      disabled={actionLoading === item.id}
                      className="flex items-center gap-1 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 shadow-sm"
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add New Guardrail Modal Dialog */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="theme-card border theme-border rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b theme-border mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FF5A14]/15 border border-[#FF5A14]/30 text-[#FF5A14] flex items-center justify-center">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black theme-heading">
                    {editingPolicy ? `Edit Guardrail Policy (${editingPolicy.id})` : 'Deploy New Guardrail Rule'}
                  </h3>
                  <p className="text-xs theme-muted">
                    {editingPolicy ? 'Update policy constraints, severity level, or project scope.' : 'Define custom autonomous constraints, format filters, or review gates.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* AI Dynamic Policy Recommendations (Only shown when deploying new policies) */}
            {!editingPolicy && (
              <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-br from-[#FF5A14]/10 via-purple-500/5 to-transparent border border-[#FF5A14]/25 shadow-inner">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-lg bg-[#FF5A14]/20 flex items-center justify-center text-[#FF5A14]">
                      <Sparkles size={12} className={aiLoading ? "animate-spin" : ""} />
                    </div>
                    <div>
                      <span className="text-xs font-black theme-heading flex items-center gap-1.5">
                        AI Telemetry Suggestions
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-wider">
                          Live Risk & Spend Engine
                        </span>
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => fetchAiSuggestions(true)}
                    disabled={aiLoading}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-[#FF5A14] hover:bg-[#FF5A14]/10 rounded-lg transition-colors disabled:opacity-50"
                    title="Re-run AI analysis on live database telemetry"
                  >
                    <RotateCw size={11} className={aiLoading ? "animate-spin" : ""} />
                    <span>{aiLoading ? "Analyzing..." : "Re-Analyze"}</span>
                  </button>
                </div>

                {aiLoading ? (
                  <div className="py-4 text-center space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FF5A14]/10 text-[#FF5A14] text-xs font-semibold animate-pulse">
                      <Cpu size={14} className="animate-spin" />
                      Auditing live project risks, budget burn & sprint telemetry with LLM...
                    </div>
                  </div>
                ) : aiSuggestions.length > 0 ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 gap-2 max-h-44 overflow-y-auto pr-1">
                      {aiSuggestions.map((sug, idx) => (
                        <div
                          key={idx}
                          onClick={() => applyTemplate(sug)}
                          className="group p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border theme-border hover:border-[#FF5A14] hover:shadow-md cursor-pointer transition-all text-left flex flex-col gap-1"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold theme-heading group-hover:text-[#FF5A14] transition-colors line-clamp-1">
                              + {sug.name}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                                sug.level === 'Strict' ? 'bg-red-500/15 text-red-600 dark:text-red-400' :
                                sug.level === 'High' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' :
                                'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                              }`}>
                                {sug.level}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700/60 theme-muted font-medium">
                                {sug.category}
                              </span>
                            </div>
                          </div>
                          {sug.rationale && (
                            <div className="text-[10px] text-[#FF5A14] font-medium flex items-center gap-1">
                              <span>⚡ {sug.rationale}</span>
                            </div>
                          )}
                          <div className="text-[11px] theme-muted line-clamp-2">
                            {sug.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] theme-muted py-2 text-center">
                    Click "Re-Analyze" to generate custom AI policies based on real project risk data.
                  </div>
                )}

                {/* Collapsible standard templates */}
                <div className="mt-2.5 pt-2 border-t theme-border flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowTemplates(!showTemplates)}
                    className="text-[10px] font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1"
                  >
                    <span>Quick Industry Templates (Static)</span>
                    {showTemplates ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                  </button>
                </div>

                {showTemplates && (
                  <div className="flex flex-wrap gap-1.5 mt-2 animate-in fade-in duration-150">
                    {QUICK_TEMPLATES.map((tpl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => applyTemplate(tpl)}
                        className="text-[10px] font-bold px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border theme-border hover:border-[#FF5A14] hover:text-[#FF5A14] transition-all text-left shadow-sm"
                      >
                        + {tpl.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Guardrail Policy Form */}
            <form onSubmit={handleSubmitPolicy} className="space-y-4">
              {/* Policy Scope Selection */}
              <div>
                <label className="block text-xs font-bold theme-heading mb-1.5">
                  Deployment Scope <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div
                    type="button"
                    onClick={() => setNewPolicy({ ...newPolicy, scope: 'project' })}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                      newPolicy.scope === 'project'
                        ? 'border-[#FF5A14] bg-[#FF5A14]/10 shadow-sm'
                        : 'theme-border hover:border-slate-400 bg-white/50 dark:bg-slate-800/50'
                    }`}
                  >
                    <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      newPolicy.scope === 'project' ? 'border-[#FF5A14]' : 'border-slate-400'
                    }`}>
                      {newPolicy.scope === 'project' && <div className="w-2 h-2 rounded-full bg-[#FF5A14]" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold theme-heading flex items-center gap-1.5">
                        <FolderKanban size={13} className="text-[#FF5A14]" />
                        <span>Project Scoped</span>
                      </div>
                      <div className="text-[11px] theme-muted mt-0.5 leading-snug">
                        Saved strictly for <strong>[{activeProject?.jira_key || 'PRJ'}] {activeProject?.name || 'Active Project'}</strong>
                      </div>
                    </div>
                  </div>

                  <div
                    type="button"
                    onClick={() => setNewPolicy({ ...newPolicy, scope: 'global' })}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                      newPolicy.scope === 'global'
                        ? 'border-purple-500 bg-purple-500/10 shadow-sm'
                        : 'theme-border hover:border-slate-400 bg-white/50 dark:bg-slate-800/50'
                    }`}
                  >
                    <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      newPolicy.scope === 'global' ? 'border-purple-500' : 'border-slate-400'
                    }`}>
                      {newPolicy.scope === 'global' && <div className="w-2 h-2 rounded-full bg-purple-500" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold theme-heading flex items-center gap-1.5">
                        <span>🌐 Enterprise Global</span>
                      </div>
                      <div className="text-[11px] theme-muted mt-0.5 leading-snug">
                        Enforced across all active projects &amp; portfolio agents
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Policy Name */}
              <div>
                <label className="block text-xs font-bold theme-heading mb-1.5">
                  Policy Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sensitive API Key &amp; Token Redaction"
                  value={newPolicy.name}
                  onChange={(e) => setNewPolicy({ ...newPolicy, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl theme-card border theme-border focus:outline-none focus:border-[#FF5A14]"
                />
              </div>

              {/* Category and Level Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold theme-heading mb-1.5">
                    Category
                  </label>
                  <select
                    value={newPolicy.category}
                    onChange={(e) => setNewPolicy({ ...newPolicy, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl theme-card border theme-border focus:outline-none focus:border-[#FF5A14]"
                  >
                    {CATEGORIES.filter(c => c !== 'All').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold theme-heading mb-1.5">
                    Enforcement Level
                  </label>
                  <select
                    value={newPolicy.level}
                    onChange={(e) => setNewPolicy({ ...newPolicy, level: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl theme-card border theme-border focus:outline-none focus:border-[#FF5A14]"
                  >
                    <option value="Strict">Strict (Hard Block / Reject)</option>
                    <option value="High">High (Mandatory Escalation)</option>
                    <option value="Warning">Warning (Telemetry Flag)</option>
                    <option value="Medium">Medium (Audit Log Only)</option>
                  </select>
                </div>
              </div>

              {/* Description & Rule Constraint */}
              <div>
                <label className="block text-xs font-bold theme-heading mb-1.5">
                  Rule Constraint Description
                </label>
                <textarea
                  rows="3"
                  placeholder="Describe the condition, validation pattern, or threshold enforced by this guardrail..."
                  value={newPolicy.description}
                  onChange={(e) => setNewPolicy({ ...newPolicy, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl theme-card border theme-border focus:outline-none focus:border-[#FF5A14] resize-none"
                ></textarea>
              </div>

              {/* Policy Status Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl theme-card border theme-border">
                <div>
                  <div className="text-xs font-bold theme-heading">
                    {editingPolicy ? 'Policy Status' : 'Initial Policy Status'}
                  </div>
                  <div className="text-[11px] theme-muted">
                    {editingPolicy ? 'Enable or disable real-time enforcement for this guardrail' : 'Enable real-time enforcement immediately upon creation'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setNewPolicy({ ...newPolicy, status: newPolicy.status === 'Active' ? 'Inactive' : 'Active' })}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                    newPolicy.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      newPolicy.status === 'Active' ? 'translate-x-4' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t theme-border">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] hover:brightness-110 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50"
                >
                  {submitting ? (
                    <span>{editingPolicy ? 'Saving Changes...' : 'Deploying Policy...'}</span>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>{editingPolicy ? 'Save Policy Changes' : 'Deploy Guardrail'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuardrailsPage;
