import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { dashboardApi } from '../api/dashboardApi';
import KPICard from '../components/dashboard/KPICard';
import BurndownChart from '../components/dashboard/BurndownChart';
import RiskHeatmap from '../components/dashboard/RiskHeatmap';

import FuturisticLoader from '../components/common/FuturisticLoader';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const ProjectDrilldown = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const details = await dashboardApi.getProjectDetails(id);
        setData(details);
      } catch (err) {
        console.error("Failed to load project details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading || !data) {
    return (
      <FuturisticLoader 
        title={`Synchronizing Project ${id} Telemetry...`} 
        subtitle="Loading milestone deliverables, risk matrices, and burn trajectories"
      />
    );
  }

  return (
    <div className="py-2 space-y-6">
      <div className="mb-2">
        <Link 
          to="/dashboard" 
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF5A14] hover:text-[#FF7A45] transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Executive Dashboard</span>
        </Link>
      </div>
      
      <div className="flex justify-between items-end pb-4 border-b border-slate-200 dark:border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black theme-heading tracking-tight">
            {data.name} <span className="text-[#FF5A14] font-mono text-xl">(Drilldown)</span>
          </h1>
          <p className="text-xs sm:text-sm theme-muted mt-1">Program engagement telemetry calibrated for project ID: {data.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {data.kpis.map((kpi, idx) => (
          <KPICard 
            key={idx}
            title={kpi.title} 
            value={kpi.value} 
            trend={kpi.trend} 
            trendLabel={kpi.trendLabel}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <BurndownChart data={data.burndown} />
        </div>
        <div>
          <RiskHeatmap data={data.risks} />
        </div>
      </div>
    </div>
  );
};

export default ProjectDrilldown;
