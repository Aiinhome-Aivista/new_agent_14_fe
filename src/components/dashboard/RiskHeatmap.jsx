import React from 'react';
import { ArrowRight, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

const RiskHeatmap = ({ data }) => {
  const formatGrid = (inputData) => {
    if (!inputData || inputData.length === 0) {
      return [
        { label: 'Critical', color: 'bg-red-500/80 hover:bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.4)]', items: ['RSK-401 Cloud Outage', 'RSK-402 SLA Breach'] },
        { label: 'High', color: 'bg-amber-500/80 hover:bg-amber-500 text-white shadow-[0_0_10px_rgba(245,158,11,0.3)]', items: ['RSK-301 Rate Limit', 'RSK-302 Key Personnel', 'RSK-303 Scope Drift'] },
        { label: 'Medium', color: 'bg-yellow-500/80 hover:bg-yellow-500 text-slate-900', items: ['RSK-201 API Latency', 'RSK-202 Token Overrun'] },
        { label: 'Low', color: 'bg-emerald-500/70 hover:bg-emerald-500 text-white', items: ['RSK-101 Documentation', 'RSK-102 Minor Patch', 'RSK-103 Timezone Lag'] }
      ];
    }

    // If inputData is already in grouped format [{ label, items }]
    if (inputData[0]?.label && Array.isArray(inputData[0]?.items)) {
      return inputData;
    }

    // If inputData is an array of individual risk objects: [{ id, severity, title, ... }]
    const critItems = [];
    const highItems = [];
    const medItems = [];
    const lowItems = [];

    inputData.forEach((r) => {
      const idStr = r.id || r.risk_id || 'R-100';
      const titleStr = r.title || r.description || '';
      const displayStr = titleStr ? `${idStr} ${titleStr}` : idStr;
      const sev = (r.severity || 'Medium').toLowerCase();

      if (sev === 'critical') {
        critItems.push(displayStr);
      } else if (sev === 'high') {
        highItems.push(displayStr);
      } else if (sev === 'medium') {
        medItems.push(displayStr);
      } else {
        lowItems.push(displayStr);
      }
    });

    return [
      { label: 'Critical', color: 'bg-red-500/80 hover:bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.4)]', items: critItems },
      { label: 'High', color: 'bg-amber-500/80 hover:bg-amber-500 text-white shadow-[0_0_10px_rgba(245,158,11,0.3)]', items: highItems },
      { label: 'Medium', color: 'bg-yellow-500/80 hover:bg-yellow-500 text-slate-900', items: medItems },
      { label: 'Low', color: 'bg-emerald-500/70 hover:bg-emerald-500 text-white', items: lowItems }
    ];
  };

  const grid = formatGrid(data);
  const totalRisks = grid.reduce((acc, row) => acc + (row.items?.length || 0), 0);

  return (
    <div className="p-6 rounded-2xl theme-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#FF5A14]/10 text-[#FF5A14] border border-[#FF5A14]/20">
            <ShieldAlert size={18} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold theme-heading">
              Autonomous Risk Heatmap
            </h3>
            <p className="text-xs theme-muted">
              Live probability × impact matrix synthesized by Risk Agent
            </p>
          </div>
        </div>

        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
          {totalRisks} Monitored
        </span>
      </div>

      <div className="space-y-3.5 my-5">
        {grid.map((row, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div className="w-20 text-[11px] font-bold theme-muted uppercase tracking-wider">
              {row.label}
            </div>
            <div className="flex-1 flex flex-wrap gap-2">
              {row.items && row.items.map((item, i) => (
                <div 
                  key={i} 
                  className={`h-8 px-3 rounded-lg flex items-center justify-center text-xs font-semibold cursor-pointer transition-all hover:scale-105 ${row.color}`}
                  title={item}
                >
                  {item.split(' ')[0]}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-xs">
        <span className="theme-muted font-medium">
          Severity weighted across active risk sources
        </span>
        <Link 
          to="/risks" 
          className="text-[#FF5A14] hover:text-[#FF7A45] font-bold flex items-center gap-1 transition-colors group"
        >
          <span>Open Full Risk Register</span>
          <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
};

export default RiskHeatmap;
