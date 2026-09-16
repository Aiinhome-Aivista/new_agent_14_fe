import re

file_path = r'e:\Pwc_Agent\VCO Agent-14\new_agent_14_fe\src\components\dashboard\PMOLeadDashboard.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pattern = r'// Extract synthesized PMO metrics or compute resilient baselines.*?(?=  return \()'

replacement = """// Extract synthesized PMO metrics dynamically
  const pmo = data?.pmo_metrics || {};
  const headcount = pmo.headcount || {
    total: 0,
    active_today: 0,
    fte: 0,
    contractor: 0,
    utilization_rate: 0,
    roles: [],
    vendors: []
  };

  const budget = pmo.budget || {
    total_planned: 0,
    total_actual: 0,
    remaining: 0,
    burn_percentage: 0,
    variance: 0,
    variance_status: 'None',
    monthly_run_rate: 0,
    cpi: 0
  };

  const timeline = pmo.timeline || {
    target_completion_date: 'TBD',
    days_remaining: 0,
    schedule_status: 'Pending',
    spi: 0,
    current_phase: 'None',
    phases: []
  };

  const tasks = pmo.tasks || {
    total: 0,
    completed: 0,
    in_progress: 0,
    under_review: 0,
    blocked: 0,
    completion_rate: 0,
    breakdown: [],
    items: []
  };

  const taskItems = tasks.items || [];

  const getPhaseDeliverables = (phase) => {
    return phase?.deliverables || [];
  };

  const governance = pmo.governance || {
    vendor_sla_adherence: 0,
    compliance_audit_score: 0,
    open_escalations: escalations.length || 0,
    gate_clearance_status: 'Pending'
  };

  // Real-time project risks calibrated for active project workspace
  const projectRisks = data?.project_risks || data?.recent_risks || (Array.isArray(risks) ? risks : []);
  const totalProjectRisks = data?.total_project_risks !== undefined ? data.total_project_risks : projectRisks.length;

  // Format currency helpers
  const fmtMoney = (val) => {
    if (val === undefined || val === null) return '$0';
    const num = Math.abs(Number(val));
    if (num >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `$${Math.round(val / 1000)}K`;
    return `$${Number(val).toLocaleString()}`;
  };

  // Burndown chart data derivation
  const chartData = data?.burndown || [];

  const isDataEmpty = !data || Object.keys(data).length === 0 || (!data.pmo_metrics && !data.financials && (!data.burndown || data.burndown.length === 0));

  if (isDataEmpty) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 mt-4 rounded-2xl theme-card border border-white/10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-[#FF5A14]">
          <FolderKanban size={32} />
        </div>
        <h3 className="text-xl font-black theme-heading mb-2">No Project Data Found</h3>
        <p className="text-sm theme-muted max-w-md mx-auto mb-6">
          The dashboard requires project data to display insights. Please import a Statement of Work (SOW) or Project Charter document to dynamically generate the dashboard metrics.
        </p>
        <button 
          onClick={() => {
            if (fileInputRef && fileInputRef.current) {
              fileInputRef.current.click();
            } else {
              const el = document.getElementById('upload-doc-btn');
              if (el) el.click();
            }
          }}
          className="px-5 py-2.5 rounded-xl bg-[#FF5A14] text-white font-bold hover:bg-[#FF7A45] transition-colors flex items-center gap-2 shadow-lg shadow-[#FF5A14]/20 mx-auto">
          <FileText size={18} />
          Import Project Document
        </button>
      </div>
    );
  }
"""

new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)
