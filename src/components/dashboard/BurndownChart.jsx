import React, { useState } from 'react';
import { 
  AreaChart, 
  Area, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import { BarChart3, TrendingUp, TrendingDown, Layers, ArrowDownRight, Compass } from 'lucide-react';

const BurndownChart = ({ data: initialData, className, minHeight = "min-h-[260px]" }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const rawData = Array.isArray(initialData) && initialData.length > 0 ? initialData : [];
  const chartData = rawData.map(d => {
    const comp = Number(d.completion_pct) || 0;
    const planned = Number(d.planned) || 0;
    const tranche_planned = Number(d.tranche_planned) || 0;
    const earned = d.earned !== undefined && d.earned !== null ? Number(d.earned) : Math.round(planned * (comp / 100));
    const tranche_earned = d.tranche_earned !== undefined && d.tranche_earned !== null 
      ? Number(d.tranche_earned) 
      : Math.round(tranche_planned * (comp / 100));
    const remaining_earned = d.remaining_earned !== undefined && d.remaining_earned !== null 
      ? Number(d.remaining_earned) 
      : Math.max(0, Math.round(planned - earned));
    return {
      ...d,
      completion_pct: comp,
      planned,
      actual: Number(d.actual) || 0,
      tranche_planned,
      tranche_actual: Number(d.tranche_actual) || 0,
      remaining_planned: Number(d.remaining_planned) || 0,
      remaining_actual: Number(d.remaining_actual) || 0,
      earned,
      tranche_earned,
      remaining_earned
    };
  });
  
  // Interactive view modes: 'cumulative' | 'tranches' | 'runway'
  const [viewMode, setViewMode] = useState('cumulative');

  // Compute live dynamic metrics from the ingested milestone data
  const finalPoint = chartData.length > 0 ? chartData[chartData.length - 1] : null;
  const firstPoint = chartData.length > 0 ? chartData[0] : null;
  
  let kpi1Label = "SOW Baseline";
  let kpi2Label = "Incurred Spend";
  let kpi3Label = "Net Variance";
  let kpi4Label = "Health Trajectory";
  
  let valPlanned = 0;
  let valActual = 0;

  if (viewMode === 'cumulative') {
    valPlanned = finalPoint?.planned ?? 0;
    valActual = finalPoint?.actual ?? 0;
    kpi1Label = "Total SOW Baseline";
    kpi2Label = "Total Incurred Spend";
  } else if (viewMode === 'tranches') {
    valPlanned = finalPoint?.tranche_planned ?? 0;
    valActual = finalPoint?.tranche_actual ?? 0;
    kpi1Label = "Latest Tranche Cap";
    kpi2Label = "Latest Tranche Spend";
    kpi3Label = "Tranche Variance";
  } else if (viewMode === 'runway') {
    valPlanned = finalPoint?.remaining_planned ?? 0;
    valActual = finalPoint?.remaining_actual ?? 0;
    kpi1Label = "Target End Runway";
    kpi2Label = "Actual End Runway";
    kpi3Label = "Runway Variance";
  }

  const netVariance = valPlanned - valActual;
  const isOverrun = netVariance < 0;

  const fmtCurrency = (val) => {
    if (val === undefined || val === null) return '$0';
    const absVal = Math.abs(val);
    const sign = val < 0 ? '-' : '';
    if (absVal >= 1000000) return `${sign}$${(absVal / 1000000).toFixed(2)}M`;
    if (absVal >= 1000) return `${sign}$${Math.round(absVal / 1000)}k`;
    return `${sign}$${Math.round(absVal).toLocaleString()}`;
  };

  const fmtFullDollar = (val) => {
    if (val === undefined || val === null) return '$0';
    return `$${Math.round(val).toLocaleString()}`;
  };

  // Custom EVM Tooltip with Work Completion & Spend Efficiency
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const currentItem = chartData.find(d => d.sprint === label) || payload[0]?.payload;
    if (!currentItem) return null;

    const plannedVal = viewMode === 'cumulative' 
      ? currentItem.planned 
      : (viewMode === 'tranches' ? currentItem.tranche_planned : currentItem.remaining_planned);

    const actualVal = viewMode === 'cumulative' 
      ? currentItem.actual 
      : (viewMode === 'tranches' ? currentItem.tranche_actual : currentItem.remaining_actual);

    const completionPct = currentItem.completion_pct ?? 0;

    // Value of work completed (Earned Value):
    // Directly clarifies: "In the money spent, how much allocated work is actually completed?"
    const earnedVal = viewMode === 'cumulative'
      ? (currentItem.earned ?? Math.round((plannedVal || 0) * (completionPct / 100)))
      : (viewMode === 'tranches'
          ? (currentItem.tranche_earned ?? Math.round((currentItem.tranche_planned || 0) * (completionPct / 100)))
          : Math.round((plannedVal || 0) * (completionPct / 100)));

    // Cash Variance (Planned SOW Baseline vs Actual Spend)
    const cashVariance = (plannedVal ?? 0) - (actualVal ?? 0);
    const isCashOverrun = cashVariance < 0;

    // True Cost Variance for Work Done (Earned Value - Actual Spend)
    // If Earned >= Actual: delivered more work value than spent (efficient)
    // If Earned < Actual: overspent for the amount of work completed (cost deficit)
    const workCostVariance = (earnedVal ?? 0) - (actualVal ?? 0);
    const isWorkDeficit = workCostVariance < 0;

    // Cost Performance Index (CPI)
    const cpi = (actualVal && actualVal > 0) ? (earnedVal / actualVal) : (completionPct > 0 ? 1.0 : 0);

    return (
      <div 
        className="p-3.5 rounded-xl text-xs font-sans shadow-2xl border backdrop-blur-md transition-all animate-fadeIn"
        style={{
          backgroundColor: isDark ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 0.98)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(203, 213, 225, 0.9)',
          color: isDark ? '#F8FAFC' : '#0F172A',
          minWidth: '260px'
        }}
      >
        {/* Header with Milestone Code, Name and Work Completion % */}
        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-1.5 font-bold">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#FF5A14]/15 text-[#FF5A14]">
              {currentItem.sprint}
            </span>
            <span className="truncate max-w-[140px]" title={currentItem.name}>
              {currentItem.name || `Milestone ${currentItem.sprint}`}
            </span>
          </div>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
            completionPct === 100 
              ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30' 
              : completionPct > 0 
                ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30' 
                : 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
          }`}>
            {completionPct}% Work Done
          </span>
        </div>

        {/* Deliverable Progress Mini Bar */}
        <div className="w-full bg-slate-200/70 dark:bg-white/10 h-1.5 rounded-full overflow-hidden mb-2.5">
          <div 
            className={`h-full transition-all duration-300 ${
              completionPct === 100 ? 'bg-emerald-500' : completionPct > 0 ? 'bg-[#FF5A14]' : 'bg-slate-400/40'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, completionPct))}%` }}
          />
        </div>

        {/* Breakdown: Planned vs Completed Work vs Incurred Spend */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">
              {viewMode === 'cumulative' ? 'Cumulative Planned (PV):' : (viewMode === 'tranches' ? 'Tranche SOW Cap (PV):' : 'Planned Runway:')}
            </span>
            <span className="font-mono font-semibold">
              {fmtFullDollar(plannedVal)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">
              Earned Work Value (EV):
            </span>
            <span className="font-mono font-bold text-emerald-500">
              {fmtFullDollar(earnedVal)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">
              {viewMode === 'cumulative' ? 'Cumulative Actual (AC):' : (viewMode === 'tranches' ? 'Incurred Spend (AC):' : 'Actual Runway:')}
            </span>
            <span className="font-mono font-bold text-[#FF5A14]">
              {fmtFullDollar(actualVal)}
            </span>
          </div>

          {/* Work Completion Efficiency & Variance Section */}
          <div className="pt-2 mt-2 border-t border-slate-200/70 dark:border-white/10 space-y-1.5">
            {actualVal > 0 && (
              <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/5 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">Work vs Spend Efficiency:</span>
                  <span className={`font-mono font-bold ${isWorkDeficit ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {cpi.toFixed(2)}x CPI
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 dark:text-slate-500">
                    {isWorkDeficit ? 'Cost Deficit for Work Done:' : 'Value Exceeds Spend:'}
                  </span>
                  <span className={`font-mono font-semibold ${isWorkDeficit ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {workCostVariance >= 0 ? `+${fmtFullDollar(workCostVariance)}` : fmtFullDollar(workCostVariance)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-0.5">
              <span className="text-slate-500 dark:text-slate-400">Cash Variance (PV - AC):</span>
              <span className={`font-mono font-bold flex items-center gap-1 ${isCashOverrun ? 'text-rose-500' : 'text-emerald-500'}`}>
                {isCashOverrun ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                {cashVariance > 0 ? `+${fmtFullDollar(cashVariance)}` : fmtFullDollar(cashVariance)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={className || "p-6 rounded-2xl theme-card flex flex-col justify-between"}>
      {/* Header section with Dynamic PMO metrics and mode toggles */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200/70 dark:border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#FF5A14]/10 text-[#FF5A14] border border-[#FF5A14]/20 shadow-sm">
            <BarChart3 size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold theme-heading">
                Milestone Budget Burndown vs. Plan
              </h3>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#FF5A14]/15 text-[#FF5A14] border border-[#FF5A14]/30">
                {chartData.length} Milestones Live
              </span>
            </div>
            <p className="text-xs theme-muted">
              Dynamically synthesized from ingested SOW contract tranches & financial ledgers
            </p>
          </div>
        </div>

        {/* View Mode Switcher Pills */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/5 border theme-border self-start md:self-auto">
          <button
            onClick={() => setViewMode('cumulative')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'cumulative'
                ? 'bg-[#FF5A14] text-white shadow-sm'
                : 'theme-muted hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Cumulative Curve
          </button>
          <button
            onClick={() => setViewMode('tranches')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'tranches'
                ? 'bg-[#FF5A14] text-white shadow-sm'
                : 'theme-muted hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Tranche Caps
          </button>
          <button
            onClick={() => setViewMode('runway')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'runway'
                ? 'bg-[#FF5A14] text-white shadow-sm'
                : 'theme-muted hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Runway Burndown
          </button>
        </div>
      </div>

      {/* Dynamic EVM KPI Quick Strip */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border theme-border">
            <span className="text-[10px] uppercase font-mono tracking-wider theme-muted block">{kpi1Label}</span>
            <span className="text-xs sm:text-sm font-mono font-bold theme-heading">{fmtFullDollar(valPlanned)}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border theme-border">
            <span className="text-[10px] uppercase font-mono tracking-wider theme-muted block">{kpi2Label}</span>
            <span className="text-xs sm:text-sm font-mono font-bold text-[#FF5A14]">{fmtFullDollar(valActual)}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border theme-border">
            <span className="text-[10px] uppercase font-mono tracking-wider theme-muted block">{kpi3Label}</span>
            <span className={`text-xs sm:text-sm font-mono font-bold ${isOverrun ? 'text-rose-500' : 'text-emerald-500'}`}>
              {netVariance > 0 ? `+${fmtFullDollar(netVariance)}` : fmtFullDollar(netVariance)}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border theme-border">
            <span className="text-[10px] uppercase font-mono tracking-wider theme-muted block">{kpi4Label}</span>
            <span className={`text-xs sm:text-sm font-bold flex items-center gap-1 ${isOverrun ? 'text-amber-500' : 'text-emerald-500'}`}>
              {isOverrun ? 'Cost Overrun Alert' : 'On Target'}
            </span>
          </div>
        </div>
      )}

      {/* Chart visualization */}
      <div className="w-full relative mt-2" style={{ height: '320px', minHeight: '320px' }}>
        {chartData.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 border border-dashed theme-border rounded-xl">
            <BarChart3 size={32} className="theme-muted mb-2 opacity-40" />
            <p className="text-xs font-semibold theme-muted">No Burndown Telemetry Recorded</p>
            <p className="text-[11px] theme-muted opacity-70 max-w-xs mt-1">
              Ingest project SOW contract or create project milestones to activate live earned value curves.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart
              key={viewMode}
              data={chartData}
              margin={{ top: 15, right: 25, left: 10, bottom: 5 }}
            >
              <defs>
                <linearGradient id="gradientActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF5A14" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#FF5A14" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="gradientPlanned" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isDark ? '#94A3B8' : '#64748B'} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={isDark ? '#64748B' : '#94A3B8'} stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="gradientEarned" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid 
                strokeDasharray="3 3" 
                vertical={false} 
                stroke={isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0'} 
              />
              
              <XAxis 
                dataKey="sprint" 
                stroke={isDark ? '#94A3B8' : '#64748B'} 
                fontSize={12} 
                fontWeight={600}
                tickLine={false} 
                axisLine={false} 
              />
              
              <YAxis 
                stroke={isDark ? '#94A3B8' : '#64748B'} 
                fontSize={11} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => fmtCurrency(value)}
                width={90}
              />
              
              <Tooltip content={<CustomTooltip />} />
              
              <Legend 
                iconType="circle" 
                wrapperStyle={{ paddingTop: '14px', fontSize: '12px' }} 
              />

              <Area 
                type="monotone" 
                dataKey={viewMode === 'cumulative' ? 'planned' : (viewMode === 'tranches' ? 'tranche_planned' : 'remaining_planned')} 
                name={viewMode === 'cumulative' ? 'Planned SOW Baseline' : (viewMode === 'tranches' ? 'Milestone SOW Cap' : 'Planned Runway Burndown')} 
                stroke={isDark ? '#94A3B8' : '#64748B'} 
                strokeWidth={2.5} 
                strokeDasharray="4 4" 
                fill="url(#gradientPlanned)"
                dot={{ r: 4, fill: isDark ? '#94A3B8' : '#64748B' }} 
              />
              <Area 
                type="monotone" 
                dataKey={viewMode === 'cumulative' ? 'earned' : (viewMode === 'tranches' ? 'tranche_earned' : 'remaining_earned')} 
                name={viewMode === 'cumulative' ? 'Work Delivered (EV)' : (viewMode === 'tranches' ? 'Tranche Work Delivered (EV)' : 'Work Runway Remaining (EV)')} 
                stroke="#10B981" 
                strokeWidth={3} 
                fill="url(#gradientEarned)"
                dot={{ r: 4.5, fill: '#10B981' }} 
                activeDot={{ r: 7.5, fill: '#34D399', stroke: '#FFFFFF', strokeWidth: 2 }} 
              />
              <Area 
                type="monotone" 
                dataKey={viewMode === 'cumulative' ? 'actual' : (viewMode === 'tranches' ? 'tranche_actual' : 'remaining_actual')} 
                name={viewMode === 'cumulative' ? 'Actual Incurred Spend' : (viewMode === 'tranches' ? 'Tranche Actual Spend' : 'Actual Runway Remaining')} 
                stroke="#FF5A14" 
                strokeWidth={3.5} 
                fill="url(#gradientActual)"
                dot={{ r: 5, fill: '#FF5A14' }}
                activeDot={{ r: 8, fill: '#FF7A45', stroke: '#FFFFFF', strokeWidth: 2 }} 
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default BurndownChart;


