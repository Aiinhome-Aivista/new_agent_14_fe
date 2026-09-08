import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const KPICard = ({ title, value, trend, trendLabel, icon }) => {
  const numTrend = trend !== undefined && trend !== null ? Number(trend) : null;
  const hasValidTrend = numTrend !== null && !isNaN(numTrend);
  const isPositive = hasValidTrend ? numTrend >= 0 : true;
  
  return (
    <div className="p-5 rounded-2xl theme-card hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
      
      {/* Subtle top ambient glow on hover */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF5A14] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xs font-bold theme-muted uppercase tracking-wider">{title}</h3>
        {icon ? (
          <div className="text-[#FF5A14] bg-[#FF5A14]/10 p-2 rounded-xl border border-[#FF5A14]/20 group-hover:scale-110 transition-transform">
            {icon}
          </div>
        ) : (
          <div className="w-2 h-2 rounded-full bg-[#FF5A14] animate-pulse"></div>
        )}
      </div>
      
      <div>
        <div className="text-2xl sm:text-3xl font-black theme-heading mb-2 tracking-tight group-hover:text-[#FF7A45] transition-colors">
          {value}
        </div>

        {hasValidTrend ? (
          <div className="flex items-center text-xs">
            <span className={`px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
              isPositive 
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
            }`}>
              {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(numTrend)}%
            </span>
            {trendLabel && (
              <span className="theme-muted ml-2 font-medium truncate">{trendLabel}</span>
            )}
          </div>
        ) : trendLabel ? (
          <div className="text-xs theme-muted font-medium truncate">
            {trendLabel}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default KPICard;
