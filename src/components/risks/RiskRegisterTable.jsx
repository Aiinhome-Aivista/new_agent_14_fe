import React, { useState } from 'react';
import { Search, ArrowUpDown } from 'lucide-react';

const RiskRegisterTable = ({ risks }) => {
  const [sortField, setSortField] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [filterOwner, setFilterOwner] = useState('');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const filteredRisks = (risks || []).filter(r => 
    (r.owner || 'Unassigned').toLowerCase().includes(filterOwner.toLowerCase()) ||
    (r.title || '').toLowerCase().includes(filterOwner.toLowerCase())
  );
  
  const sortedRisks = [...filteredRisks].sort((a, b) => {
    if (!sortField) return 0;
    const valA = a[sortField];
    const valB = b[sortField];
    
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  return (
    <div className="theme-card rounded-2xl overflow-hidden shadow-sm">
      <div className="p-4 sm:p-5 border-b theme-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 theme-subtle">
        <div>
          <h3 className="font-bold theme-heading text-sm sm:text-base">Active Program Risks</h3>
          <span className="text-xs theme-muted">{sortedRisks.length} risks logged across portfolio</span>
        </div>
        
        <div className="relative w-full sm:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Filter by owner or title..." 
            value={filterOwner}
            onChange={(e) => setFilterOwner(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs theme-input rounded-xl focus:outline-none focus:border-[#FF5A14] transition-colors"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="theme-subtle border-b theme-border uppercase tracking-wider font-bold theme-muted">
              <th className="p-4 cursor-pointer hover:text-[#FF5A14] transition-colors" onClick={() => handleSort('id')}>
                <div className="flex items-center gap-1">ID <ArrowUpDown size={12} /></div>
              </th>
              <th className="p-4 cursor-pointer hover:text-[#FF5A14] transition-colors" onClick={() => handleSort('title')}>
                <div className="flex items-center gap-1">Title <ArrowUpDown size={12} /></div>
              </th>
              <th className="p-4 cursor-pointer hover:text-[#FF5A14] transition-colors" onClick={() => handleSort('severity')}>
                <div className="flex items-center gap-1">Severity <ArrowUpDown size={12} /></div>
              </th>
              <th className="p-4 cursor-pointer hover:text-[#FF5A14] transition-colors" onClick={() => handleSort('status')}>
                <div className="flex items-center gap-1">Status <ArrowUpDown size={12} /></div>
              </th>
              <th className="p-4 cursor-pointer hover:text-[#FF5A14] transition-colors" onClick={() => handleSort('owner')}>
                <div className="flex items-center gap-1">Owner <ArrowUpDown size={12} /></div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y theme-border">
            {sortedRisks.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center theme-muted italic">
                  No matching risks found.
                </td>
              </tr>
            ) : (
              sortedRisks.map((risk, idx) => (
                <tr key={idx} className="theme-subtle-hover transition-colors">
                  <td className="p-4 font-mono font-bold text-[#FF5A14]">{risk.id}</td>
                  <td className="p-4 font-medium theme-heading">{risk.title}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                      risk.severity === 'Critical' ? 'bg-red-500/15 text-red-500 border border-red-500/30' : 
                      risk.severity === 'High' ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30' : 
                      risk.severity === 'Medium' ? 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30' : 
                      'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {risk.severity}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold theme-badge">
                      {risk.status || 'Open'}
                    </span>
                  </td>
                  <td className="p-4 theme-muted font-medium">{risk.owner || 'Unassigned'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RiskRegisterTable;
