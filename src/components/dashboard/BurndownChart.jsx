import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import { BarChart3 } from 'lucide-react';

const BurndownChart = ({ data: initialData, className, minHeight = "min-h-[220px]" }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const chartData = initialData && initialData.length > 0 ? initialData : [
    { sprint: 'Sprint 1', planned: 250000, actual: 240000 },
    { sprint: 'Sprint 2', planned: 200000, actual: 210000 },
    { sprint: 'Sprint 3', planned: 150000, actual: 165000 },
    { sprint: 'Sprint 4', planned: 100000, actual: 95000 },
    { sprint: 'Sprint 5', planned: 50000, actual: 42000 },
    { sprint: 'Sprint 6', planned: 0, actual: 0 }
  ];
  
  return (
    <div className={className || "p-6 rounded-2xl theme-card h-96 flex flex-col justify-between"}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#FF5A14]/10 text-[#FF5A14] border border-[#FF5A14]/20">
            <BarChart3 size={18} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold theme-heading">
              Milestone Budget Burndown vs. Plan
            </h3>
            <p className="text-xs theme-muted">
              Autonomous trajectory forecast calibrated against active SOWs
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-[#FF5A14]/15 text-[#FF5A14] border border-[#FF5A14]/30">
          Telemetry Live
        </span>
      </div>

      <div className={`flex-1 w-full h-full ${minHeight}`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke={isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0'} 
            />
            <XAxis 
              dataKey="sprint" 
              stroke={isDark ? '#94A3B8' : '#64748B'} 
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
            />
            <YAxis 
              stroke={isDark ? '#94A3B8' : '#64748B'} 
              fontSize={11} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(value) => `$${value/1000}k`}
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '12px', 
                backgroundColor: isDark ? '#141A28' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#CBD5E1',
                color: isDark ? '#FFFFFF' : '#0F172A',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)'
              }}
              formatter={(value) => [`$${value.toLocaleString()}`, '']}
            />
            <Legend 
              iconType="circle" 
              wrapperStyle={{ paddingTop: '14px', fontSize: '12px' }} 
            />
            <Line 
              type="monotone" 
              dataKey="planned" 
              name="Planned Target" 
              stroke={isDark ? '#64748B' : '#94A3B8'} 
              strokeWidth={2} 
              strokeDasharray="4 4" 
              dot={{ r: 3 }} 
            />
            <Line 
              type="monotone" 
              dataKey="actual" 
              name="Actual Spend" 
              stroke="#FF5A14" 
              strokeWidth={3} 
              activeDot={{ r: 7, fill: '#FF7A45', stroke: '#FFFFFF', strokeWidth: 2 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BurndownChart;
