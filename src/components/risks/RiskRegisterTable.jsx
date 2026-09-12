import React, { useState } from 'react';
import { 
  Search, ArrowUpDown, ChevronDown, ChevronUp, 
  CheckCircle2, Clock, AlertTriangle, Edit3, Save, UserCheck,
  Send, ExternalLink, Loader2, Share2, ShieldAlert, Sparkles, Check,
  Layers, Server, Building2, DollarSign, Activity, FileText,
  FolderKanban, LayoutGrid, ListFilter
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { risksApi } from '../../api/risksApi';

const OWNER_OPTIONS = [
  "Unassigned",
  "Lead Cloud Architect",
  "Chief InfoSec Officer",
  "PMO Program Director",
  "Vendor Delivery Head",
  "Financial Controller"
];

const STATUS_OPTIONS = ['Open', 'Mitigated', 'Closed'];

const CATEGORY_OPTIONS = [
  'ALL',
  'Architecture & Tech',
  'Security & Compliance',
  'Infrastructure & Cloud',
  'Vendor & SLA',
  'Financial & Budget',
  'Delivery & Schedule'
];

const RiskRegisterTable = ({ risks, activeProject, onUpdateRisk, onRiskUpdated }) => {
  const [sortField, setSortField] = useState('severity');
  const [sortAsc, setSortAsc] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' (Project-wise divide) | 'flat'
  const [collapsedProjects, setCollapsedProjects] = useState({});
  const [expandedRiskId, setExpandedRiskId] = useState(null);
  const [editingMitigationId, setEditingMitigationId] = useState(null);
  const [mitigationDraft, setMitigationDraft] = useState('');
  const [pushingJiraId, setPushingJiraId] = useState(null);
  const { showToast } = useToast();

  const isAllProjects = !activeProject || activeProject.id === 'all' || activeProject.jira_key === 'ALL';

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleStatusChange = (risk, newStatus) => {
    if (onUpdateRisk) {
      onUpdateRisk(risk.id, { status: newStatus });
    }
  };

  const handleOwnerChange = (risk, newOwner) => {
    if (onUpdateRisk) {
      onUpdateRisk(risk.id, { owner: newOwner });
    }
  };

  const toggleProjectCollapse = (pKey) => {
    setCollapsedProjects(prev => ({
      ...prev,
      [pKey]: !prev[pKey]
    }));
  };

  const handlePushToJira = async (risk) => {
    try {
      setPushingJiraId(risk.id);
      const res = await risksApi.pushToJira(risk.id);
      if (res.success && res.risk) {
        if (onRiskUpdated) {
          onRiskUpdated(res.risk);
        }
        showToast(res.message || `Jira ticket ${res.jira_issue_key} created successfully!`, 'success');
      } else {
        showToast(res.error || 'Failed to push risk to Jira', 'error');
      }
    } catch (err) {
      console.error('Push to Jira error:', err);
      const msg = err.response?.data?.error || err.message || 'Failed to push risk to Jira';
      showToast(msg, 'error');
    } finally {
      setPushingJiraId(null);
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

  // Distinct projects list
  const availableProjects = Array.from(
    new Set((risks || []).map(r => r.project_key || `PRJ-${r.project_id || 'Global'}`))
  ).filter(Boolean);

  const filteredRisks = (risks || []).filter(r => {
    const pKey = r.project_key || `PRJ-${r.project_id || 'Global'}`;
    const matchProject = isAllProjects || pKey === activeProject?.jira_key || String(r.project_id) === String(activeProject?.id);

    const matchQuery = 
      (r.owner || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.risk_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.project_key || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.project_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.jira_issue_key || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchSev = selectedSeverity === 'ALL' || r.severity === selectedSeverity;
    const matchStat = selectedStatus === 'ALL' || (r.status || 'Open') === selectedStatus;
    const matchCat = selectedCategory === 'ALL' || (r.category || 'Architecture & Tech') === selectedCategory;

    return matchProject && matchQuery && matchSev && matchStat && matchCat;
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

  // Group risks by project
  const projectGroups = availableProjects.reduce((acc, pKey) => {
    if (!isAllProjects && activeProject?.jira_key && pKey !== activeProject.jira_key) {
      return acc;
    }
    const pRisks = sortedRisks.filter(
      r => (r.project_key || `PRJ-${r.project_id || 'Global'}`) === pKey
    );
    if (pRisks.length > 0) {
      const pName = pRisks[0].project_name || `Enterprise Project ${pKey}`;
      acc.push({
        project_key: pKey,
        project_name: pName,
        project_id: pRisks[0].project_id,
        risks: pRisks,
        criticalCount: pRisks.filter(r => r.severity === 'Critical' && (r.status === 'Open' || !r.status)).length,
        highCount: pRisks.filter(r => r.severity === 'High' && (r.status === 'Open' || !r.status)).length,
        mitigatedCount: pRisks.filter(r => r.status === 'Mitigated').length,
        closedCount: pRisks.filter(r => r.status === 'Closed').length,
        total: pRisks.length
      });
    }
    return acc;
  }, []);

  // Category Icon Resolver
  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'Security & Compliance':
        return <ShieldAlert size={12} className="text-purple-400" />;
      case 'Infrastructure & Cloud':
        return <Server size={12} className="text-blue-400" />;
      case 'Vendor & SLA':
        return <Building2 size={12} className="text-amber-400" />;
      case 'Financial & Budget':
        return <DollarSign size={12} className="text-emerald-400" />;
      case 'Delivery & Schedule':
        return <Clock size={12} className="text-indigo-400" />;
      default:
        return <Activity size={12} className="text-[#FF5A14]" />;
    }
  };

  // Render a Single Risk Row
  const renderRiskRow = (risk) => {
    const isExpanded = expandedRiskId === risk.id;
    const isEditingMitigation = editingMitigationId === risk.id;
    const status = risk.status || 'Open';
    const category = risk.category || 'Architecture & Tech';
    const riskScore = risk.risk_score || (risk.severity === 'Critical' ? 9.2 : risk.severity === 'High' ? 7.5 : risk.severity === 'Medium' ? 5.0 : 3.0);
    const exposure = risk.financial_exposure || (risk.severity === 'Critical' ? '$350K+' : risk.severity === 'High' ? '$150K+' : '$50K+');
    const impactLabel = risk.impact_label || (risk.severity === 'Critical' ? 'Halts Release Gate' : risk.severity === 'High' ? 'Elevated PMO Attention' : 'Monitored Baseline');

    return (
      <React.Fragment key={risk.id}>
        <tr className={`theme-subtle-hover transition-colors ${isExpanded ? 'bg-[#FF5A14]/5' : ''}`}>
          
          {/* Risk ID & Category */}
          <td className="p-4 whitespace-nowrap">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono font-black text-[#FF5A14] text-xs">
                {risk.risk_id || `R-${risk.id}`}
              </span>
              {risk.project_key && (
                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30">
                  [{risk.project_key}]
                </span>
              )}
            </div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-white/5 border theme-border theme-muted">
              {getCategoryIcon(category)}
              <span className="truncate max-w-[130px]">{category}</span>
            </div>
          </td>

          {/* Title & Plain English Impact Preview */}
          <td className="p-4 max-w-md">
            <div 
              className="font-bold theme-heading text-xs sm:text-sm hover:text-[#FF7A45] cursor-pointer" 
              onClick={() => setExpandedRiskId(isExpanded ? null : risk.id)}
            >
              {risk.title}
            </div>
            <div className="text-[11px] theme-muted line-clamp-1 mt-0.5 leading-relaxed">
              {risk.description || 'No description provided'}
            </div>
            <div className="mt-1 flex items-center gap-2 text-[10px] font-medium">
              <span className="text-[#FF7A45] font-semibold flex items-center gap-1">
                <Activity size={10} />
                {impactLabel}
              </span>
              <span className="text-slate-400">•</span>
              <span className="theme-muted font-mono">Exposure: {exposure}</span>
            </div>
          </td>

          {/* Severity & Score Badge */}
          <td className="p-4 whitespace-nowrap">
            <div className="flex flex-col gap-1">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider inline-flex items-center justify-between gap-2 ${
                risk.severity === 'Critical' ? 'bg-red-500/15 text-red-500 border border-red-500/30' : 
                risk.severity === 'High' ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30' : 
                risk.severity === 'Medium' ? 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30' : 
                'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
              }`}>
                <span>{risk.severity}</span>
                <span className="font-mono text-[9px] opacity-90">{riskScore}/10</span>
              </span>
              <span className="text-[10px] theme-muted font-mono pl-1">
                Prob: <strong className="theme-heading">{risk.probability || (risk.severity === 'Critical' ? 'High' : 'Medium')}</strong>
              </span>
            </div>
          </td>

          {/* Interactive Status Selector */}
          <td className="p-4 whitespace-nowrap">
            <div className="relative inline-flex items-center">
              <select
                value={status}
                onChange={(e) => handleStatusChange(risk, e.target.value)}
                className={`appearance-none pl-6 pr-6 py-1 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer focus:outline-none border ${
                  status === 'Open' ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/25' :
                  status === 'Mitigated' ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30 hover:bg-sky-500/25' :
                  'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                }`}
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt} value={opt} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                    {opt}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2">
                {status === 'Open' && <AlertTriangle size={11} className="text-rose-500" />}
                {status === 'Mitigated' && <Clock size={11} className="text-sky-500" />}
                {status === 'Closed' && <CheckCircle2 size={11} className="text-emerald-500" />}
              </div>
              <div className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400">
                <ChevronDown size={11} />
              </div>
            </div>
          </td>

          {/* Interactive Owner Select */}
          <td className="p-4 whitespace-nowrap">
            <div className="flex items-center gap-1.5">
              <UserCheck size={14} className={risk.owner && risk.owner !== 'Unassigned' ? 'text-emerald-500' : 'text-slate-400'} />
              <select
                value={risk.owner || 'Unassigned'}
                onChange={(e) => handleOwnerChange(risk, e.target.value)}
                className="px-2.5 py-1 text-xs theme-input rounded-xl focus:outline-none focus:border-[#FF5A14] font-medium max-w-[170px] truncate"
              >
                {OWNER_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </td>

          {/* 1-Click Push to Jira Cloud */}
          <td className="p-4 text-center whitespace-nowrap">
            {risk.jira_issue_key ? (
              <a
                href={`https://dipakkrsaha44.atlassian.net/browse/${risk.jira_issue_key}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-mono font-bold border border-blue-500/30 text-xs transition-all shadow-sm group"
                title="Open live ticket in Jira Cloud"
              >
                <span className="w-2 h-2 rounded-full bg-blue-500 group-hover:scale-125 transition-transform" />
                <span>{risk.jira_issue_key}</span>
                <ExternalLink size={12} />
              </a>
            ) : (
              <button
                type="button"
                disabled={pushingJiraId === risk.id}
                onClick={() => handlePushToJira(risk)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                title="Push detected risk as a new ticket to Jira Cloud"
              >
                {pushingJiraId === risk.id ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    <span>Pushing...</span>
                  </>
                ) : (
                  <>
                    <Send size={12} />
                    <span>Push to Jira</span>
                  </>
                )}
              </button>
            )}
          </td>

          {/* View Details Toggle */}
          <td className="p-4 text-center whitespace-nowrap">
            <button
              type="button"
              onClick={() => setExpandedRiskId(isExpanded ? null : risk.id)}
              className="px-3 py-1 rounded-xl theme-card border theme-border hover:border-[#FF5A14]/50 theme-heading text-xs font-semibold inline-flex items-center gap-1 transition-all cursor-pointer"
            >
              <span>{isExpanded ? 'Hide' : 'Plan'}</span>
              {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </td>
        </tr>

        {/* EXPANDABLE RICH DETAIL CARD */}
        {isExpanded && (
          <tr className="bg-slate-50/80 dark:bg-slate-900/60 border-b theme-border animate-in fade-in duration-200">
            <td colSpan={7} className="p-4 sm:p-6">
              <div className="space-y-4 max-w-5xl mx-auto">
                
                {/* Card Top Title & Quick Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b theme-border">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF5A14]" />
                    <h5 className="text-sm font-bold theme-heading">
                      Risk Intelligence & Mitigation Dossier: <span className="text-[#FF5A14] font-mono">{risk.risk_id}</span>
                    </h5>
                    {risk.project_name && (
                      <span className="text-xs theme-muted font-medium">({risk.project_name})</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {status !== 'Mitigated' && (
                      <button
                        onClick={() => handleStatusChange(risk, 'Mitigated')}
                        className="px-3 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-600 dark:text-sky-400 font-bold text-xs border border-sky-500/30 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Check size={12} />
                        <span>Mark as Mitigated</span>
                      </button>
                    )}

                    {!isEditingMitigation ? (
                      <button
                        type="button"
                        onClick={() => handleStartEditMitigation(risk)}
                        className="px-3 py-1 rounded-lg bg-[#FF5A14]/15 hover:bg-[#FF5A14]/25 text-[#FF5A14] font-bold text-xs border border-[#FF5A14]/30 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Edit3 size={12} />
                        <span>Edit Mitigation</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSaveMitigation(risk)}
                        className="px-3 py-1 bg-[#FF5A14] text-white rounded-lg text-xs font-bold shadow hover:brightness-110 flex items-center gap-1 cursor-pointer"
                      >
                        <Save size={12} />
                        <span>Save Mitigation Plan</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 3-Section Intuitive Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Section 1: Problem & Root Cause */}
                  <div className="p-4 rounded-xl theme-card border theme-border flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5 flex items-center gap-1.5">
                        <FileText size={13} className="text-blue-500" />
                        <span>1. What is the Problem?</span>
                      </span>
                      <p className="text-xs theme-heading leading-relaxed font-medium">
                        {risk.description || 'No detailed root cause recorded in current snapshot.'}
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t theme-border text-[10px] theme-muted flex justify-between">
                      <span>Category: <strong>{category}</strong></span>
                      <span>Owner: <strong>{risk.owner || 'Unassigned'}</strong></span>
                    </div>
                  </div>

                  {/* Section 2: Business & Delivery Impact */}
                  <div className="p-4 rounded-xl theme-card border theme-border flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5 flex items-center gap-1.5">
                        <AlertTriangle size={13} className="text-amber-500" />
                        <span>2. Business & Delivery Impact</span>
                      </span>
                      <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed font-medium">
                        {impactLabel}. Potential financial exposure of <strong className="font-mono">{exposure}</strong> and risk of contractual SLA breach if left unresolved.
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t theme-border text-[10px] theme-muted flex justify-between">
                      <span>Severity: <strong className="text-red-500">{risk.severity}</strong></span>
                      <span>Score: <strong className="font-mono">{riskScore}/10</strong></span>
                    </div>
                  </div>

                  {/* Section 3: Actionable Containment Strategy */}
                  <div className="p-4 rounded-xl theme-card border border-emerald-500/30 bg-emerald-500/[0.03] flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider block mb-1.5 flex items-center gap-1.5">
                        <ShieldAlert size={13} className="text-emerald-500" />
                        <span>3. Containment & Remediation Plan</span>
                      </span>
                      
                      {isEditingMitigation ? (
                        <textarea
                          rows={3}
                          value={mitigationDraft}
                          onChange={(e) => setMitigationDraft(e.target.value)}
                          className="w-full p-2.5 text-xs theme-input rounded-xl border focus:outline-none focus:border-[#FF5A14] font-sans"
                          placeholder="Enter concrete mitigation steps..."
                        />
                      ) : (
                        <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                          {risk.mitigation_plan || 'No formal mitigation plan submitted yet. Click "Edit Mitigation" to assign action steps.'}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t theme-border text-[10px] theme-muted flex justify-between items-center">
                      <span>Remediation State:</span>
                      <span className="font-bold text-emerald-500">{status === 'Mitigated' ? 'Active & Controlled' : 'Action Required'}</span>
                    </div>
                  </div>

                </div>

                {/* Jira Cloud Live Link Ribbon */}
                <div className="p-3 rounded-xl theme-subtle border theme-border flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Share2 size={14} className="text-blue-500" />
                    <span className="font-medium theme-heading">Jira Cloud Synchronized Delivery Item:</span>
                    {risk.jira_issue_key ? (
                      <span className="font-mono font-bold text-blue-500">{risk.jira_issue_key}</span>
                    ) : (
                      <span className="theme-muted font-mono text-[11px]">Unlinked</span>
                    )}
                  </div>
                  {risk.jira_issue_key ? (
                    <a
                      href={`https://dipakkrsaha44.atlassian.net/browse/${risk.jira_issue_key}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#FF5A14] hover:text-[#FF7A45] font-bold text-xs flex items-center gap-1"
                    >
                      <span>Inspect in Jira</span>
                      <ExternalLink size={12} />
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handlePushToJira(risk)}
                      disabled={pushingJiraId === risk.id}
                      className="text-blue-500 hover:text-blue-400 font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <span>Sync Ticket to Jira Cloud</span>
                      <Send size={11} />
                    </button>
                  )}
                </div>

              </div>
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Search, View Mode, and Filters Card */}
      <div className="theme-card rounded-2xl overflow-hidden shadow-sm border theme-border p-4 sm:p-5 flex flex-col gap-4">
        
        {/* Row 1: View Mode Switcher + Project Filter Pills + Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b theme-border">
          
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode: Grouped (Project-wise divide) vs Flat List */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl border theme-border">
              <button
                onClick={() => setViewMode('grouped')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'grouped'
                    ? 'bg-[#FF5A14] text-white shadow-sm'
                    : 'theme-muted hover:theme-heading'
                }`}
                title="Divide risks clearly by project"
              >
                <FolderKanban size={13} />
                <span>Divide by Project</span>
              </button>
              <button
                onClick={() => setViewMode('flat')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'flat'
                    ? 'bg-[#FF5A14] text-white shadow-sm'
                    : 'theme-muted hover:theme-heading'
                }`}
                title="View all risks in a single consolidated table"
              >
                <ListFilter size={13} />
                <span>Consolidated List</span>
              </button>
            </div>

            {/* Severity Quick Filter */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl border theme-border">
              {['ALL', 'Critical', 'High', 'Medium', 'Low'].map(sev => (
                <button
                  key={sev}
                  onClick={() => setSelectedSeverity(sev)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
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
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
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
          <div className="relative w-full lg:w-80">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search risk, category, impact, owner, Jira key..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs theme-input rounded-xl focus:outline-none focus:border-[#FF5A14] transition-colors"
            />
          </div>
        </div>

        {/* Header Governance Scope Context */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs py-1 border-b theme-border">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF5A14]" />
            <span className="theme-muted font-medium">Active Governance Scope:</span>
            <span className="font-mono text-[#FF7A45] font-extrabold text-xs">
              {isAllProjects ? '[ALL] All Monitored Projects (Portfolio)' : `[${activeProject?.jira_key}] ${activeProject?.name}`}
            </span>
          </div>
          <span className="text-[11px] theme-muted">
            {isAllProjects 
              ? 'Divided project-wise below. Switch active project via the header dropdown above.' 
              : 'Filtered strictly to active project. Switch to All Projects via the top header.'}
          </span>
        </div>

        {/* Row 3: Category Quick Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none pt-1 border-t theme-border">
          <span className="text-[11px] font-bold uppercase tracking-wider theme-muted mr-1 flex-shrink-0">
            Category:
          </span>
          {CATEGORY_OPTIONS.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white shadow-sm'
                  : 'theme-card border theme-border theme-muted hover:text-white hover:border-[#FF5A14]/40'
              }`}
            >
              {cat !== 'ALL' && getCategoryIcon(cat)}
              <span>{cat}</span>
            </button>
          ))}
        </div>

      </div>

      {/* ========================================================= */}
      {/* MODE 1: DIVIDE BY PROJECT (GROUPED PROJECT-WISE SECTIONS) */}
      {/* ========================================================= */}
      {viewMode === 'grouped' ? (
        projectGroups.length === 0 ? (
          <div className="theme-card rounded-2xl p-12 text-center theme-muted italic border theme-border">
            No matching program risks found for the current filters.
          </div>
        ) : (
          <div className="space-y-6">
            {projectGroups.map((group) => {
              const isCollapsed = !!collapsedProjects[group.project_key];

              return (
                <div 
                  key={group.project_key}
                  className="theme-card rounded-2xl overflow-hidden shadow-sm border border-white/10 transition-all hover:border-[#FF5A14]/30"
                >
                  {/* Project Header Banner */}
                  <div 
                    onClick={() => toggleProjectCollapse(group.project_key)}
                    className="p-4 sm:p-5 border-b theme-border bg-gradient-to-r from-slate-100 via-slate-50 to-transparent dark:from-slate-800/60 dark:via-slate-900/40 dark:to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF5A14] to-[#E04808] flex items-center justify-center text-white font-mono font-extrabold text-xs shadow-[0_0_15px_rgba(255,90,20,0.35)] flex-shrink-0 tracking-tight">
                        {group.project_key.replace('PRJ-', 'P').substring(0, 4)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#FF7A45]">
                            [{group.project_key}]
                          </span>
                          <h4 className="text-base font-extrabold theme-heading tracking-tight">
                            {group.project_name}
                          </h4>
                        </div>
                        <p className="text-xs theme-muted mt-0.5">
                          {group.total} Monitored Risk(s) • {group.criticalCount > 0 ? `${group.criticalCount} Critical Showstopper(s)` : 'Zero Critical Blockers'}
                        </p>
                      </div>
                    </div>

                    {/* Project Badges & Collapse Toggle */}
                    <div className="flex items-center gap-2.5 self-start sm:self-auto">
                      {group.criticalCount > 0 && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider bg-red-500/15 text-red-500 border border-red-500/30 flex items-center gap-1">
                          <ShieldAlert size={12} />
                          <span>{group.criticalCount} Critical</span>
                        </span>
                      )}
                      {group.highCount > 0 && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider bg-amber-500/15 text-amber-500 border border-amber-500/30">
                          {group.highCount} High
                        </span>
                      )}
                      {group.mitigatedCount > 0 && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider bg-sky-500/15 text-sky-500 border border-sky-500/30">
                          {group.mitigatedCount} Mitigated
                        </span>
                      )}
                      
                      <div className="p-1.5 rounded-lg theme-card border theme-border text-slate-400 hover:text-white transition-colors ml-1">
                        {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                      </div>
                    </div>
                  </div>

                  {/* Project Table (Rendered if not collapsed) */}
                  {!isCollapsed && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="theme-subtle border-b theme-border uppercase tracking-wider font-bold theme-muted text-[11px]">
                            <th className="p-4 cursor-pointer hover:text-[#FF5A14] transition-colors whitespace-nowrap" onClick={() => handleSort('risk_id')}>
                              <div className="flex items-center gap-1">Risk ID & Category <ArrowUpDown size={11} /></div>
                            </th>
                            <th className="p-4 cursor-pointer hover:text-[#FF5A14] transition-colors" onClick={() => handleSort('title')}>
                              <div className="flex items-center gap-1">Risk Title & Plain English Impact <ArrowUpDown size={11} /></div>
                            </th>
                            <th className="p-4 cursor-pointer hover:text-[#FF5A14] transition-colors whitespace-nowrap" onClick={() => handleSort('severity')}>
                              <div className="flex items-center gap-1">Severity & Score <ArrowUpDown size={11} /></div>
                            </th>
                            <th className="p-4 cursor-pointer hover:text-[#FF5A14] transition-colors whitespace-nowrap" onClick={() => handleSort('status')}>
                              <div className="flex items-center gap-1">Governance Status <ArrowUpDown size={11} /></div>
                            </th>
                            <th className="p-4 cursor-pointer hover:text-[#FF5A14] transition-colors whitespace-nowrap" onClick={() => handleSort('owner')}>
                              <div className="flex items-center gap-1">Owner Assignment <ArrowUpDown size={11} /></div>
                            </th>
                            <th className="p-4 text-center whitespace-nowrap">Jira Sync</th>
                            <th className="p-4 text-center whitespace-nowrap">Plan & Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y theme-border">
                          {group.risks.map((risk) => renderRiskRow(risk))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* ========================================================= */
        /* MODE 2: FLAT CONSOLIDATED TABLE */
        /* ========================================================= */
        <div className="theme-card rounded-2xl overflow-hidden shadow-sm border theme-border">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="theme-subtle border-b theme-border uppercase tracking-wider font-bold theme-muted text-[11px]">
                  <th className="p-4 cursor-pointer hover:text-[#FF5A14] transition-colors whitespace-nowrap" onClick={() => handleSort('risk_id')}>
                    <div className="flex items-center gap-1">Risk ID & Project <ArrowUpDown size={11} /></div>
                  </th>
                  <th className="p-4 cursor-pointer hover:text-[#FF5A14] transition-colors" onClick={() => handleSort('title')}>
                    <div className="flex items-center gap-1">Risk Title & Plain English Impact <ArrowUpDown size={11} /></div>
                  </th>
                  <th className="p-4 cursor-pointer hover:text-[#FF5A14] transition-colors whitespace-nowrap" onClick={() => handleSort('severity')}>
                    <div className="flex items-center gap-1">Severity & Score <ArrowUpDown size={11} /></div>
                  </th>
                  <th className="p-4 cursor-pointer hover:text-[#FF5A14] transition-colors whitespace-nowrap" onClick={() => handleSort('status')}>
                    <div className="flex items-center gap-1">Governance Status <ArrowUpDown size={11} /></div>
                  </th>
                  <th className="p-4 cursor-pointer hover:text-[#FF5A14] transition-colors whitespace-nowrap" onClick={() => handleSort('owner')}>
                    <div className="flex items-center gap-1">Owner Assignment <ArrowUpDown size={11} /></div>
                  </th>
                  <th className="p-4 text-center whitespace-nowrap">Jira Sync</th>
                  <th className="p-4 text-center whitespace-nowrap">Plan & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y theme-border">
                {sortedRisks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center theme-muted italic">
                      No matching program risks found. Try adjusting your search query or category filter.
                    </td>
                  </tr>
                ) : (
                  sortedRisks.map((risk) => renderRiskRow(risk))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default RiskRegisterTable;
