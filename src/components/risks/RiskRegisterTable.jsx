import React, { useState } from 'react';
import { 
  Search, ArrowUpDown, ChevronDown, ChevronUp, 
  CheckCircle2, Clock, AlertTriangle, Edit3, Save, UserCheck 
} from 'lucide-react';

const OWNER_OPTIONS = [
  "Unassigned",
  "Lead Cloud Architect",
  "Chief InfoSec Officer",
  "PMO Program Director",
  "Vendor Delivery Head",
  "Financial Controller"
];

const STATUS_CYCLE = {
  'Open': 'Mitigated',
  'Mitigated': 'Closed',
  'Closed': 'Open'
};

const RiskRegisterTable = ({ risks, onUpdateRisk }) => {
  const [sortField, setSortField] = useState('severity');
  const [sortAsc, setSortAsc] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [expandedRiskId, setExpandedRiskId] = useState(null);
  const [editingMitigationId, setEditingMitigationId] = useState(null);
  const [mitigationDraft, setMitigationDraft] = useState('');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleToggleStatus = (risk) => {
    const current = risk.status || 'Open';
    const nextStatus = STATUS_CYCLE[current] || 'Open';
    if (onUpdateRisk) {
      onUpdateRisk(risk.id, { status: nextStatus });
    }
  };

  const handleOwnerChange = (risk, newOwner) => {
    if (onUpdateRisk) {
      onUpdateRisk(risk.id, { owner: newOwner });
    }
  };

  const handleStartEditMitigation = (risk) => {
    setEditingMitigationId(risk.id);
    setMitigationDraft(risk.mitigation_plan || '');
  };

  const handleSaveMitigation = (risk) => {
    if (onUpdateRisk) {
      onUpdateRisk(risk.id, { mitigation_plan: mitigationDraft });
    }
    setEditingMitigationId(null);
  };

  const severityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };

  const filteredRisks = (risks || []).filter(r => {
    const matchQuery = 
      (r.owner || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.risk_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchSev = selectedSeverity === 'ALL' || r.severity === selectedSeverity;
    const matchStat = selectedStatus === 'ALL' || (r.status || 'Open') === selectedStatus;

    return matchQuery && matchSev && matchStat;
  });

  const sortedRisks = [...filteredRisks].sort((a, b) => {
    if (!sortField) return 0;
    let valA = a[sortField];
    let valB = b[sortField];

    if (sortField === 'severity') {
      valA = severityOrder[valA] || 0;
      valB = severityOrder[valB] || 0;
    }

    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  return (
    <div className="theme-card rounded-2xl overflow-hidden shadow-sm border theme-border">
      {/* Search and Filters Bar */}
      <div className="p-4 sm:p-5 border-b theme-border flex flex-col lg:flex-row lg:items-center justify-between gap-4 theme-subtle">
        <div className="flex flex-wrap items-center gap-2">
          {/* Severity Quick Filter */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl border theme-border">
            {['ALL', 'Critical', 'High', 'Medium', 'Low'].map(sev => (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  selectedSeverity === sev 
                    ? 'bg-white dark:bg-slate-800 theme-heading shadow-sm' 
                    : 'theme-muted hover:theme-heading'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Status Quick Filter */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl border theme-border">
            {['ALL', 'Open', 'Mitigated', 'Closed'].map(st => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  selectedStatus === st 
                    ? 'bg-[#FF5A14] text-white shadow-sm' 
                    : 'theme-muted hover:theme-heading'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
        
        {/* Search Input */}
        <div className="relative w-full lg:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search risk ID, title, owner..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs theme-input rounded-xl focus:outline-none focus:border-[#FF5A14] transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="theme-subtle border-b theme-border uppercase tracking-wider font-bold theme-muted">
              <th className="p-4 cursor-pointer hover:text-[#FF5A14] transition-colors" onClick={() => handleSort('risk_id')}>
                <div className="flex items-center gap-1">Risk ID <ArrowUpDown size={12} /></div>
              </th>
              <th className="p-4 cursor-pointer hover:text-[#FF5A14] transition-colors" onClick={() => handleSort('title')}>
                <div className="flex items-center gap-1">Title & Description <ArrowUpDown size={12} /></div>
              </th>
              <th className="p-4 cursor-pointer hover:text-[#FF5A14] transition-colors" onClick={() => handleSort('severity')}>
                <div className="flex items-center gap-1">Severity <ArrowUpDown size={12} /></div>
              </th>
              <th className="p-4 cursor-pointer hover:text-[#FF5A14] transition-colors" onClick={() => handleSort('status')}>
                <div className="flex items-center gap-1">Status (Click to Cycle) <ArrowUpDown size={12} /></div>
              </th>
              <th className="p-4 cursor-pointer hover:text-[#FF5A14] transition-colors" onClick={() => handleSort('owner')}>
                <div className="flex items-center gap-1">Owner Assignment <ArrowUpDown size={12} /></div>
              </th>
              <th className="p-4 text-center">Mitigation</th>
            </tr>
          </thead>
          <tbody className="divide-y theme-border">
            {sortedRisks.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center theme-muted italic">
                  No matching program risks found.
                </td>
              </tr>
            ) : (
              sortedRisks.map((risk) => {
                const isExpanded = expandedRiskId === risk.id;
                const isEditingMitigation = editingMitigationId === risk.id;
                const status = risk.status || 'Open';

                return (
                  <React.Fragment key={risk.id}>
                    <tr className="theme-subtle-hover transition-colors">
                      {/* Risk ID */}
                      <td className="p-4 font-mono font-bold text-[#FF5A14] whitespace-nowrap">
                        {risk.risk_id || `R-${risk.id}`}
                      </td>

                      {/* Title & Desc */}
                      <td className="p-4 max-w-sm">
                        <div className="font-bold theme-heading">{risk.title}</div>
                        <div className="text-[11px] theme-muted line-clamp-1 mt-0.5">
                          {risk.description || 'No description provided'}
                        </div>
                      </td>

                      {/* Severity Badge */}
                      <td className="p-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          risk.severity === 'Critical' ? 'bg-red-500/15 text-red-500 border border-red-500/30' : 
                          risk.severity === 'High' ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30' : 
                          risk.severity === 'Medium' ? 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30' : 
                          'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {risk.severity}
                        </span>
                      </td>

                      {/* Interactive Status Pill */}
                      <td className="p-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(risk)}
                          title="Click to cycle status: Open -> Mitigated -> Closed"
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 ${
                            status === 'Open' ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-500/25' :
                            status === 'Mitigated' ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 hover:bg-sky-500/25' :
                            'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                          }`}
                        >
                          {status === 'Open' && <AlertTriangle size={12} />}
                          {status === 'Mitigated' && <Clock size={12} />}
                          {status === 'Closed' && <CheckCircle2 size={12} />}
                          <span>{status}</span>
                        </button>
                      </td>

                      {/* Interactive Owner Select */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <UserCheck size={14} className={risk.owner && risk.owner !== 'Unassigned' ? 'text-emerald-500' : 'text-slate-400'} />
                          <select
                            value={risk.owner || 'Unassigned'}
                            onChange={(e) => handleOwnerChange(risk, e.target.value)}
                            className="px-2.5 py-1 text-xs theme-input rounded-xl focus:outline-none focus:border-[#FF5A14] font-medium"
                          >
                            {OWNER_OPTIONS.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                      </td>

                      {/* Mitigation Accordion Toggle */}
                      <td className="p-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setExpandedRiskId(isExpanded ? null : risk.id)}
                          className="px-3 py-1 rounded-xl theme-card border theme-border hover:border-[#FF5A14]/50 theme-heading text-xs font-semibold inline-flex items-center gap-1 transition-all"
                        >
                          <span>Plan</span>
                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                      </td>
                    </tr>

                    {/* Accordion Row for Mitigation Strategy */}
                    {isExpanded && (
                      <tr className="bg-slate-50 dark:bg-slate-900/40 border-b theme-border">
                        <td colSpan={6} className="p-4 sm:p-5">
                          <div className="max-w-3xl space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold theme-heading uppercase tracking-wider flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#FF5A14]" />
                                AI Tree-of-Thoughts Mitigation Strategy & Root Cause
                              </span>

                              {!isEditingMitigation ? (
                                <button
                                  type="button"
                                  onClick={() => handleStartEditMitigation(risk)}
                                  className="flex items-center gap-1 text-[11px] font-bold text-[#FF5A14] hover:underline"
                                >
                                  <Edit3 size={12} /> Edit Plan
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSaveMitigation(risk)}
                                  className="flex items-center gap-1 px-3 py-1 bg-[#FF5A14] text-white rounded-lg text-[11px] font-bold shadow hover:brightness-110"
                                >
                                  <Save size={12} /> Save Plan
                                </button>
                              )}
                            </div>

                            {/* Full Description */}
                            <div className="p-3 rounded-xl theme-card border theme-border text-xs leading-relaxed theme-heading">
                              <span className="font-bold text-slate-400 mr-2">Context:</span>
                              {risk.description || 'No additional technical context logged.'}
                            </div>

                            {/* Mitigation Plan Box or Textarea */}
                            {isEditingMitigation ? (
                              <textarea
                                rows={3}
                                value={mitigationDraft}
                                onChange={(e) => setMitigationDraft(e.target.value)}
                                className="w-full p-3 text-xs theme-input rounded-xl border focus:outline-none focus:border-[#FF5A14] font-sans"
                                placeholder="Enter updated mitigation containment steps..."
                              />
                            ) : (
                              <div className="p-3.5 rounded-xl bg-[#FF5A14]/5 border border-[#FF5A14]/20 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                                <span className="font-bold text-[#FF5A14] block mb-1">Containment Strategy:</span>
                                {risk.mitigation_plan || 'No formal mitigation plan submitted yet. Click "Edit Plan" to assign mitigation actions.'}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RiskRegisterTable;
