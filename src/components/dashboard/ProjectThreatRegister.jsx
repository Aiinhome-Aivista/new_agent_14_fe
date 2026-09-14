import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Search, ArrowRight, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';

const ProjectThreatRegister = ({ 
  risks = [], 
  activeProject = null, 
  totalCount = null,
  maxDisplay = 5,
  title = "Program Issues & Threat Register"
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  // Fallback calculations for total count
  const allRisksList = Array.isArray(risks) ? risks : [];
  const actualTotalCount = totalCount !== null ? totalCount : allRisksList.length;

  // Real-time search and severity filtering
  const filteredRisks = useMemo(() => {
    return allRisksList.filter((r) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = !q || 
        (r.risk_id && r.risk_id.toLowerCase().includes(q)) ||
        (r.title && r.title.toLowerCase().includes(q)) ||
        (r.description && r.description.toLowerCase().includes(q)) ||
        (r.category && r.category.toLowerCase().includes(q)) ||
        (r.owner && r.owner.toLowerCase().includes(q));

      const sev = (r.severity || 'Medium').toUpperCase();
      const matchesSeverity = severityFilter === 'ALL' || sev === severityFilter;

      return matchesSearch && matchesSeverity;
    });
  }, [allRisksList, searchTerm, severityFilter]);

  // Display only the recent 5 risks (or up to maxDisplay)
  const displayedRisks = filteredRisks.slice(0, maxDisplay);
  const hasMoreRisks = actualTotalCount > maxDisplay;
  const remainingCount = Math.max(0, actualTotalCount - maxDisplay);

  const handleDrilldown = (risk) => {
    const riskCode = risk.risk_id || risk.id;
    const projId = activeProject?.id || activeProject?.jira_key || '';
    navigate(`/risks?search=${encodeURIComponent(riskCode)}${projId ? `&project_id=${encodeURIComponent(projId)}` : ''}`);
  };

  const handleSeeMore = () => {
    const projId = activeProject?.id || activeProject?.jira_key || '';
    navigate(`/risks${projId ? `?project_id=${encodeURIComponent(projId)}` : ''}`);
  };

  const getSeverityBadge = (sevRaw) => {
    const sev = String(sevRaw || 'Medium').toUpperCase();
    if (sev === 'CRITICAL') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase font-mono tracking-wider bg-red-500/15 text-red-500 border border-red-500/30">
          CRITICAL
        </span>
      );
    }
    if (sev === 'HIGH') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase font-mono tracking-wider bg-amber-500/15 text-amber-500 border border-amber-500/30">
          HIGH
        </span>
      );
    }
    if (sev === 'MEDIUM') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase font-mono tracking-wider bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30">
          MEDIUM
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase font-mono tracking-wider bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
        LOW
      </span>
    );
  };

  return (
    <div className="p-6 rounded-2xl theme-card border border-white/10 shadow-lg space-y-4">
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b theme-border">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 shadow-sm">
              <ShieldAlert size={18} />
            </div>
            <h3 className="text-base font-bold theme-heading flex items-center gap-2">
              <span>{title}</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-[#FF5A14]/15 text-[#FF5A14] border border-[#FF5A14]/30">
                {actualTotalCount}
              </span>
            </h3>
          </div>
          <p className="text-xs theme-muted mt-1">
            Click &apos;Drill Down into Issue&apos; on any item to view root-cause analysis, financial exposure, and mitigation plan.
          </p>
        </div>

        {/* Search & Severity Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[180px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 theme-muted pointer-events-none" />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search issues..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl theme-subtle border theme-border text-xs focus:outline-none focus:border-[#FF5A14]/60 transition-colors"
            />
          </div>

          <select 
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl theme-subtle border theme-border text-xs font-semibold focus:outline-none focus:border-[#FF5A14]/60 cursor-pointer"
          >
            <option value="ALL">All Severity</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Table Content or Zero State */}
      {displayedRisks.length === 0 ? (
        <div className="py-12 text-center theme-subtle rounded-xl border theme-border p-6">
          <CheckCircle2 size={36} className="text-emerald-500 mx-auto mb-2.5" />
          <h4 className="text-sm font-bold theme-heading">Zero Active Threats Flagged</h4>
          <p className="text-xs theme-muted mt-1 max-w-md mx-auto">
            {searchTerm || severityFilter !== 'ALL'
              ? 'No risks match the active search filter criteria.'
              : `All active deliverables, vendor SLAs, and milestone schedules for ${activeProject?.name || 'this project'} are operating within nominal governance parameters.`}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b theme-border text-[11px] font-bold theme-muted uppercase tracking-wider">
                <th className="pb-3 px-3">Risk ID</th>
                <th className="pb-3 px-3">Title & Threat Summary</th>
                <th className="pb-3 px-3">Category</th>
                <th className="pb-3 px-3">Severity</th>
                <th className="pb-3 px-3">Financial Exposure</th>
                <th className="pb-3 px-3">Owner</th>
                <th className="pb-3 px-3 text-right">Drilldown Action</th>
              </tr>
            </thead>
            <tbody className="divide-y theme-border font-medium">
              {displayedRisks.map((r, idx) => {
                const exposure = r.financial_exposure || (r.severity === 'Critical' ? '$350K - $500K' : r.severity === 'High' ? '$120K - $250K' : '< $50K');
                const category = r.category || 'Architecture & Tech';
                const owner = r.owner || 'Unassigned';

                return (
                  <tr 
                    key={r.id || idx}
                    onClick={() => handleDrilldown(r)}
                    className="hover:bg-[#FF5A14]/5 transition-colors cursor-pointer group"
                    title={`Click to drill down into issue ${r.risk_id || r.id} in Risk Register`}
                  >
                    {/* RISK ID */}
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-[#FF5A14] group-hover:underline flex items-center gap-1">
                        {r.risk_id || `R-${r.id}`}
                      </span>
                    </td>

                    {/* TITLE & THREAT SUMMARY */}
                    <td className="py-3 px-3 max-w-[280px]">
                      <div className="font-bold theme-heading group-hover:text-[#FF7A45] transition-colors truncate" title={r.title}>
                        {r.title || 'Delivery & Architecture Risk'}
                      </div>
                      {r.description && (
                        <p className="text-[11px] theme-muted truncate mt-0.5" title={r.description}>
                          {r.description}
                        </p>
                      )}
                    </td>

                    {/* CATEGORY */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md theme-subtle border theme-border text-[10px] font-semibold text-slate-400">
                        {category}
                      </span>
                    </td>

                    {/* SEVERITY */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {getSeverityBadge(r.severity)}
                    </td>

                    {/* FINANCIAL EXPOSURE */}
                    <td className="py-3 px-3 whitespace-nowrap font-mono font-bold theme-heading text-[11px]">
                      {exposure}
                    </td>

                    {/* OWNER */}
                    <td className="py-3 px-3 whitespace-nowrap theme-muted text-[11px]">
                      {owner}
                    </td>

                    {/* DRILLDOWN ACTION BUTTON */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDrilldown(r);
                        }}
                        className="px-3 py-1 rounded-lg bg-[#FF5A14]/10 hover:bg-[#FF5A14] text-[#FF5A14] hover:text-white font-bold text-[11px] transition-all inline-flex items-center gap-1 shadow-sm group-hover:shadow-[0_0_12px_rgba(255,90,20,0.3)] cursor-pointer"
                      >
                        <span>Drill Down</span>
                        <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer Bar with "See More" Button */}
      {actualTotalCount > 0 && (
        <div className="pt-3 border-t theme-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <span className="theme-muted font-medium">
            {hasMoreRisks ? (
              <>Showing <strong>{displayedRisks.length}</strong> of <strong>{actualTotalCount}</strong> active risks for this project</>
            ) : (
              <>Showing all <strong>{actualTotalCount}</strong> active risks for this project</>
            )}
          </span>

          <div className="flex items-center gap-2">
            {hasMoreRisks ? (
              <button
                type="button"
                onClick={handleSeeMore}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] hover:brightness-110 text-white font-extrabold text-xs shadow-md transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(255,90,20,0.25)]"
                title={`Open Risk Register to see all ${actualTotalCount} risks for ${activeProject?.name || 'this project'}`}
              >
                <span>See More (+{remainingCount} More Risks)</span>
                <ArrowRight size={13} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSeeMore}
                className="px-3.5 py-1.5 rounded-xl theme-subtle border theme-border hover:border-[#FF5A14]/50 text-[#FF5A14] hover:bg-[#FF5A14]/10 font-bold text-xs transition-all inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Open Full Risk Register</span>
                <ExternalLink size={12} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectThreatRegister;
