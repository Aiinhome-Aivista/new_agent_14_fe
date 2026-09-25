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
  const chartData = Array.isArray(initialData) && initialData.length > 0 ? initialData : [];
  
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

  // Custom EVM Tooltip
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

    const varVal = currentItem.variance ?? ((plannedVal ?? 0) - (actualVal ?? 0));
    const isItemOverrun = varVal < 0;

    return (
      <div 
        className="p-3.5 rounded-xl text-xs font-sans shadow-2xl border backdrop-blur-md transition-all animate-fadeIn"
        style={{
          backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.97)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(203, 213, 225, 0.9)',
          color: isDark ? '#F8FAFC' : '#0F172A',
          minWidth: '220px'
        }}
      >
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-1.5 font-bold">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#FF5A14]/15 text-[#FF5A14]">
              {currentItem.sprint}
            </span>
            <span className="truncate max-w-[170px]" title={currentItem.name}>
              {currentItem.name || `Milestone ${currentItem.sprint}`}
            </span>
          </div>
          {currentItem.completion_pct !== undefined && (
            <span className="text-[10px] font-mono opacity-70">
              {currentItem.completion_pct}%
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">
              {viewMode === 'cumulative' ? 'Cumulative Planned' : (viewMode === 'tranches' ? 'Tranche SOW Cap' : 'Planned Runway')}:
            </span>
            <span className="font-mono font-semibold">
              {fmtFullDollar(plannedVal)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">
              {viewMode === 'cumulative' ? 'Cumulative Actual' : (viewMode === 'tranches' ? 'Incurred Spend' : 'Actual Runway')}:
            </span>
            <span className="font-mono font-bold text-[#FF5A14]">
              {fmtFullDollar(actualVal)}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-200/70 dark:border-white/10">
            <span className="text-slate-500 dark:text-slate-400">Variance:</span>
            <span className={`font-mono font-bold flex items-center gap-1 ${isItemOverrun ? 'text-rose-500' : 'text-emerald-500'}`}>
              {isItemOverrun ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
              {varVal > 0 ? `+${fmtFullDollar(varVal)}` : fmtFullDollar(varVal)}
            </span>
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


