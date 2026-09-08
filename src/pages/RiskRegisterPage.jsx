import React, { useState, useEffect } from 'react';
import RiskRegisterTable from '../components/risks/RiskRegisterTable';
import { risksApi } from '../api/risksApi';
import FuturisticLoader from '../components/common/FuturisticLoader';

const RiskRegisterPage = () => {
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRisks = async () => {
      try {
        setLoading(true);
        const data = await risksApi.getRisks();
        setRisks(data);
      } catch (err) {
        console.error("Failed to fetch risks", err);
        setError("Unable to load risk register data.");
      } finally {
        setLoading(false);
      }
    };
    fetchRisks();
  }, []);

  if (loading) {
    return (
      <FuturisticLoader 
        title="Loading Autonomous Risk Register..." 
        subtitle="Aggregating cross-program delivery bottlenecks and severity scores"
      />
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="p-6 rounded-2xl theme-card border-red-500/40 text-center max-w-xl mx-auto">
          <h3 className="text-sm font-bold text-red-500">Error Loading Risks</h3>
          <p className="mt-2 text-xs theme-muted">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-2 space-y-6">
      <div className="pb-2 border-b border-slate-200 dark:border-white/10">
        <h1 className="text-2xl sm:text-3xl font-black theme-heading tracking-tight">Program Risk Register</h1>
        <p className="text-xs sm:text-sm theme-muted mt-1">Manage and track all program risks with automated probability × impact calculation.</p>
      </div>
      
      <RiskRegisterTable risks={risks} />
    </div>
  );
};

export default RiskRegisterPage;
