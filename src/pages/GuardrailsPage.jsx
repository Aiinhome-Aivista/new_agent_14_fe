import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { guardrailsApi } from '../api/guardrailsApi';
import { ShieldCheck, ShieldAlert, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import FuturisticLoader from '../components/common/FuturisticLoader';

const GuardrailsPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [guardrailsData, setGuardrailsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await guardrailsApi.getGuardrails();
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
  }, []);

  const handleResolve = async (itemId, decision) => {
    try {
      setActionLoading(itemId);
      await guardrailsApi.resolveQueueItem(itemId, decision, `Resolved as ${decision} by ${user?.email || 'Officer'}`);
      showToast(`Item #${itemId} marked as ${decision}`, 'success');
      await fetchData();
    } catch (err) {
      console.error("Resolution failed:", err);
      const msg = err.response?.data?.error || "Resolution failed. Please verify your session.";
      showToast(msg, 'error');
    } finally {
      setActionLoading(null);
    }
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
  const stats = guardrailsData?.stats || { active_policies: policies.length, pending_approvals: 0 };

  return (
    <div className="py-2 h-full flex flex-col space-y-8">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200 dark:border-white/10">
        <h1 className="text-2xl sm:text-3xl font-black theme-heading tracking-tight">Guardrails & Human Oversight</h1>
        <p className="text-xs sm:text-sm theme-muted mt-1">Review active AI policies, safety constraints, and escalation approval queues.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="theme-card p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl border border-blue-500/20">
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="text-2xl font-black theme-heading">{stats.active_policies}</div>
            <div className="text-[11px] font-bold theme-muted uppercase tracking-wider mt-0.5">Active Safety Policies</div>
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
            <div className="text-[11px] font-bold theme-muted uppercase tracking-wider mt-0.5">Compliance & Audit Coverage</div>
          </div>
        </div>
      </div>

      {/* Active Policies Table */}
      <div className="theme-card rounded-2xl p-6">
        <h2 className="text-base font-bold theme-heading mb-4 flex items-center gap-2">
          <ShieldCheck className="text-[#FF5A14]" size={20} />
          <span>Active Agent Policies & Safety Constraints</span>
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="uppercase tracking-wider border-b border-slate-200 dark:border-white/10 theme-muted font-bold">
              <tr>
                <th className="py-3 px-4">Policy ID</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Enforcement</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y theme-border">
              {policies.map((p) => (
                <tr key={p.id} className="theme-subtle-hover transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-[#FF5A14]">{p.id}</td>
                  <td className="py-3 px-4 font-bold theme-heading">{p.name}</td>
                  <td className="py-3 px-4 theme-muted font-mono">{p.category}</td>
                  <td className="py-3 px-4 theme-heading leading-relaxed">{p.description}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                      p.level === 'Strict' 
                        ? 'bg-red-500/15 text-red-500 border border-red-500/30' 
                        : 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                    }`}>
                      {p.level}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-500">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Human-in-the-loop Approval Queue */}
      <div className="theme-card rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-bold theme-heading flex items-center gap-2">
            <ShieldAlert className="text-[#FF5A14]" size={20} />
            <span>Human-in-the-Loop Escalation Queue</span>
          </h2>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full theme-badge">
            {approvalQueue.length} total items
          </span>
        </div>

        {approvalQueue.length === 0 ? (
          <div className="text-center py-10 border border-dashed theme-border rounded-2xl">
            <CheckCircle className="mx-auto text-emerald-500 mb-2" size={32} />
            <p className="theme-heading font-bold text-sm">All Escalations Resolved</p>
            <p className="text-xs theme-muted mt-1">No items currently require human operator intervention.</p>
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
                  </div>
                  <p className="text-xs theme-muted">{item.reasoning || 'Automated escalation flag'}</p>
                  <div className="text-[11px] theme-muted flex items-center gap-1 mt-1 font-mono">
                    <Clock size={12} />
                    Created: {item.created_at ? new Date(item.created_at).toLocaleString() : 'Recent'}
                  </div>
                </div>

                {item.status === 'Pending' && ['PMO', 'Program Director'].includes(user?.role) && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleResolve(item.id, 'Approved')}
                      disabled={actionLoading === item.id}
                      className="flex items-center gap-1 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 shadow-sm"
                    >
                      <CheckCircle size={14} /> Approve
                    </button>
                    <button
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
    </div>
  );
};

export default GuardrailsPage;
