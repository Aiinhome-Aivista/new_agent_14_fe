import React, { useState, useEffect } from 'react';
import { reportsApi } from '../api/reportsApi';
import ReportCard from '../components/reports/ReportCard';
import FuturisticLoader from '../components/common/FuturisticLoader';
import { useToast } from '../context/ToastContext';
import { useProject } from '../context/ProjectContext';
import { FileText, Sparkles, Loader2, RefreshCw, FolderKanban } from 'lucide-react';

const ReportsPage = () => {
  const { activeProject } = useProject();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await reportsApi.getReports(activeProject?.id);
      setReports(data || []);
    } catch (err) {
      console.error(err);
      setError("Unable to load reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [activeProject?.id]);

  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      const pid = activeProject?.id || 1;
      const res = await reportsApi.generateReport(pid);
      showToast(res.message || `Executive briefing for ${activeProject?.name || 'Project'} generated successfully!`, "success");
      await fetchReports();
    } catch (err) {
      console.error(err);
      showToast("Failed to generate report.", "error");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <FuturisticLoader 
        title="Synthesizing Executive Briefings..." 
        subtitle="Compiling cross-program milestone metrics, risk logs, and financial burn"
      />
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="p-6 rounded-2xl theme-card border-red-500/40 text-center max-w-xl mx-auto">
          <h3 className="text-sm font-bold text-red-500">Error Loading Reports</h3>
          <p className="mt-2 text-xs theme-muted">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-2 flex flex-col h-full space-y-6">
      <div className="pb-4 border-b theme-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#FF5A14]/15 text-[#FF5A14] border border-[#FF5A14]/30 flex items-center gap-1">
              <FolderKanban size={11} />
              <span>[{activeProject?.jira_key || 'PRJ'}] {activeProject?.name || 'All Projects'}</span>
            </span>
            <span className="text-xs theme-muted font-mono">
              Project Executive Archive
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black theme-heading tracking-tight">Generated Reports</h1>
          <p className="text-xs sm:text-sm theme-muted mt-1">
            Download auto-generated executive briefings and portfolio health decks for {activeProject?.name || 'selected workspace'}.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGenerateReport}
          disabled={generating}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] hover:brightness-110 text-white rounded-xl text-xs font-bold shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
        >
          {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          <span>{generating ? 'Synthesizing Briefing...' : 'Generate Executive Report'}</span>
        </button>
      </div>

      {reports.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed theme-border rounded-2xl theme-card p-12 text-center">
          <FileText className="mx-auto text-slate-400 mb-3" size={40} />
          <h3 className="text-base font-bold theme-heading">No Reports Available</h3>
          <p className="text-xs theme-muted mt-1 max-w-md">
            No executive reports generated for {activeProject?.name || 'this project'} yet. Click 'Generate Executive Report' above to synthesize a real-time briefing.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
