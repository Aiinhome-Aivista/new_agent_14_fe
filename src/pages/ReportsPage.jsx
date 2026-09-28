import React, { useState, useEffect } from 'react';
import { reportsApi } from '../api/reportsApi';
import ReportCard from '../components/reports/ReportCard';
import FuturisticLoader from '../components/common/FuturisticLoader';
import { useToast } from '../context/ToastContext';
import { useProject } from '../context/ProjectContext';
import { 
  FileText, 
  FileCode2, 
  Sparkles, 
  Loader2, 
  FolderKanban 
} from 'lucide-react';

const ReportsPage = () => {
  const { activeProject } = useProject();
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState('pdf'); // 'pdf' | 'docx'
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

  const handleDeleteReport = async (reportId) => {
    try {
      const res = await reportsApi.deleteReport(reportId);
      if (res.success) {
        showToast("Report deleted successfully.", "success");
        setReports(prev => prev.filter(r => r.id !== reportId));
      } else {
        showToast(res.error || "Failed to delete report.", "error");
      }
    } catch (err) {
      console.error("Error deleting report:", err);
      showToast("Failed to delete report.", "error");
    }
  };

  // Segregate PDF vs DOCX reports
  const pdfReports = reports.filter(r => 
    r?.name?.toLowerCase().endsWith('.pdf') || r?.file_type?.toLowerCase() === 'pdf'
  );
  const docxReports = reports.filter(r => 
    r?.name?.toLowerCase().endsWith('.docx') || r?.file_type?.toLowerCase() === 'docx'
  );

  const displayedReports = activeTab === 'pdf' ? pdfReports : docxReports;

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
    <div className="py-2 flex flex-col min-h-full space-y-5 pb-12">
      {/* Top Header & Project Scope */}
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
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] hover:brightness-110 text-white rounded-xl text-xs font-bold shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer flex-shrink-0"
        >
          {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          <span>{generating ? 'Synthesizing Briefing...' : 'Generate Executive Report'}</span>
        </button>
      </div>

      {/* Format Switcher: 2 Distinct Tabs (PDF vs Word) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center p-1.5 rounded-2xl theme-card border theme-border shadow-sm max-w-fit gap-1.5">
          {/* Tab 1: PDF Briefings */}
          <button
            type="button"
            onClick={() => setActiveTab('pdf')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'pdf'
                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 shadow-sm'
                : 'theme-muted hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'
            }`}
          >
            <FileText size={15} className={activeTab === 'pdf' ? 'text-rose-500' : 'text-slate-400'} />
            <span>Executive PDF Briefings</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              activeTab === 'pdf' 
                ? 'bg-rose-500 text-white' 
                : 'bg-slate-200 dark:bg-white/10 theme-muted'
            }`}>
              {pdfReports.length}
            </span>
          </button>

          {/* Tab 2: Word Documents */}
          <button
            type="button"
            onClick={() => setActiveTab('docx')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'docx'
                ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 shadow-sm'
                : 'theme-muted hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'
            }`}
          >
            <FileCode2 size={15} className={activeTab === 'docx' ? 'text-blue-500' : 'text-slate-400'} />
            <span>Enterprise Word (.docx)</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              activeTab === 'docx' 
                ? 'bg-blue-500 text-white' 
                : 'bg-slate-200 dark:bg-white/10 theme-muted'
            }`}>
              {docxReports.length}
            </span>
          </button>
        </div>

        {/* Tab Context Helper Note */}
        <div className="text-xs theme-muted flex items-center gap-1.5 font-medium">
          <span className={`w-2 h-2 rounded-full ${
            activeTab === 'pdf' ? 'bg-rose-500' : 'bg-blue-500'
          }`} />
          <span>
            {activeTab === 'pdf' && `Displaying ${pdfReports.length} boardroom-ready Executive PDF Briefings`}
            {activeTab === 'docx' && `Displaying ${docxReports.length} editable Enterprise Word (.docx) Documents`}
          </span>
        </div>
      </div>

      {/* Reports Grid or Empty State */}
      {displayedReports.length === 0 ? (
        <div className="flex-1 min-h-[300px] flex flex-col items-center justify-center border-2 border-dashed theme-border rounded-2xl theme-card p-12 text-center">
          {activeTab === 'pdf' ? (
            <FileText className="mx-auto text-rose-400/80 mb-3" size={44} />
          ) : (
            <FileCode2 className="mx-auto text-blue-400/80 mb-3" size={44} />
          )}
          <h3 className="text-base font-bold theme-heading">
            {activeTab === 'pdf' ? 'No PDF Briefings Available' : 'No Word Documents Available'}
          </h3>
          <p className="text-xs theme-muted mt-1 max-w-md">
            {activeTab === 'pdf' 
              ? `No executive PDF briefings generated for ${activeProject?.name || 'this project'} yet.` 
              : `No enterprise Word documents generated for ${activeProject?.name || 'this project'} yet.`}
            {' '}Click 'Generate Executive Report' above to synthesize a real-time briefing.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedReports.map((report) => (
            <ReportCard 
              key={report.id} 
              report={report} 
              onDelete={handleDeleteReport}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
