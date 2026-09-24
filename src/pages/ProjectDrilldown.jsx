import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { useToast } from '../context/ToastContext';
import { dashboardApi } from '../api/dashboardApi';
import KPICard from '../components/dashboard/KPICard';
import BurndownChart from '../components/dashboard/BurndownChart';
import RiskHeatmap from '../components/dashboard/RiskHeatmap';
import ProjectThreatRegister from '../components/dashboard/ProjectThreatRegister';
import FuturisticLoader from '../components/common/FuturisticLoader';
import { 
  ArrowLeft, 
  ArrowRight, 
  Users, 
  Briefcase, 
  CheckCircle2, 
  Layers, 
  ChevronRight, 
  Sparkles,
  ExternalLink,
  DollarSign,
  Calendar,
  Clock,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Building2,
  Check,
  Zap,
  Filter,
  Search,
  Download,
  CreditCard,
  Receipt,
  Server,
  Code,
  Cpu,
  FileText,
  X,
  PieChart,
  AlertCircle,
  Tag,
  Info,
  ChevronDown
} from 'lucide-react';

const ProjectDrilldown = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { activeProject, selectProject } = useProject();
  const { showToast } = useToast();

  const [data, setData] = useState(null);
  const [teamData, setTeamData] = useState(null);
  const [expandedPhase, setExpandedPhase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Budget drilldown interactive states
  const [budgetCategoryFilter, setBudgetCategoryFilter] = useState('all');
  const [budgetStatusFilter, setBudgetStatusFilter] = useState('all');
  const [budgetSearchTerm, setBudgetSearchTerm] = useState('');
  const [selectedExpenseModal, setSelectedExpenseModal] = useState(null);
  const [selectedDomainModal, setSelectedDomainModal] = useState(null);
  const [selectedMilestoneModal, setSelectedMilestoneModal] = useState(null);

  // Tab filtering: 'all' | 'team' | 'budget' | 'schedule' | 'governance' | 'threats' | ('completion' for Investor only)
  const rawTab = searchParams.get('tab') || 'all';
  const currentTab = (rawTab === 'completion' && user?.role !== 'Investor') ? 'all' : rawTab;

  const handleTabChange = (tabKey) => {
    if (tabKey === 'completion' && user?.role !== 'Investor') return;
    setSearchParams(tabKey === 'all' ? {} : { tab: tabKey });
  };

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [details, team] = await Promise.all([
          dashboardApi.getProjectDetails(id),
          dashboardApi.getProjectTeam(id).catch(err => {
            console.warn("Project team fetch error in drilldown:", err);
            return null;
          })
        ]);

        if (isMounted) {
          setData(details);
          if (team) {
            setTeamData(team);
          } else if (details?.team_summary) {
            setTeamData({
              total_resources: details.team_summary.total || 0,
              roles: details.team_summary.roles || [],
              vendors: details.team_summary.vendors || [],
              members: details.team_summary.members || []
            });
          }

          // Sync activeProject in context
          if (details && (!activeProject || (activeProject.id !== details.numeric_id && activeProject.jira_key !== details.id))) {
            selectProject({
              id: details.numeric_id || details.id,
              jira_key: details.id,
              name: details.name,
              status: details.status
            });
          }
        }
      } catch (err) {
        console.error("Failed to load project drilldown:", err);
        if (isMounted) {
          setError(err.message || "Failed to load project details.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Scroll to hash section if present on initial render
  useEffect(() => {
    if (!loading && data) {
      const hash = window.location.hash;
      if (hash) {
        const el = document.querySelector(hash);
        if (el) {
          setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
        }
      }
    }
  }, [loading, data]);

  if (loading) {
    return (
      <FuturisticLoader 
        title="Synthesizing Project Intelligence..." 
        subtitle={`Calibrating role-wise telemetry, budget trajectory, and milestones for project: ${id}`} 
      />
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center animate-fadeIn">
        <div className="p-6 rounded-2xl theme-card border border-red-500/30">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-3">
            <Layers size={24} />
          </div>
          <h2 className="text-base font-bold theme-heading mb-1">Project Workspace Unavailable</h2>
          <p className="text-xs sm:text-sm theme-muted mb-6 leading-relaxed">
            {error || `Unable to load data for project '${id}'.`}
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white text-xs font-bold shadow-lg hover:brightness-110 transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Return to Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  const getPersonaDashboardLabel = () => {
    if (user?.role === 'PMO') return 'PMO Command Center';
    if (user?.role === 'Program Director') return 'Program Governance';
    if (user?.role === 'Project Manager') return 'Project Execution';
    return 'Executive Dashboard';
  };

  const projectKey = data.id || id;
  const projectNumericId = data.numeric_id || id;
  const rolesList = teamData?.roles || data.team_summary?.roles || [];
  const totalResources = teamData?.total_resources !== undefined 
    ? teamData.total_resources 
    : (data.team_summary?.total || (teamData?.members?.length || 0));

  const budget = data.budget_summary || {
  total_planned: 0,
  total_actual: 0,
  remaining: 0,
  burn_percentage: 0,
  variance: 0,
  variance_status: 'None'
};

  const timeline = data.timeline_summary || {
    target_completion_date: "Pending SOW",
    days_remaining: 0,
    spi: 1.00,
    schedule_status: "New Workspace (Awaiting SOW)",
    phases: []
  };

  const governance = data.governance_summary || {
    vendor_sla_adherence: 0,
    compliance_audit_score: 0,
    gate_clearance_status: 'Pending'
  };

  const completion = data.completion_summary || {
    percentage: 0,
    basis: 'Initial Phase',
    label: '0% Initial Phase (Awaiting SOW / Task Ingestion)',
    tasks: { completed: 0, total: 0, percentage: 0 },
    milestones: { completed: 0, total: 0, percentage: 0 },
    timeline: { elapsed_months: 0, total_months: 0, percentage: 0 }
  };

  const fmtMoney = (val) => {
    if (val === undefined || val === null) return '$0';
    if (Math.abs(val) >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
    if (Math.abs(val) >= 1000) return `$${(val / 1000).toFixed(0)}k`;
    return `$${val.toLocaleString()}`;
  };

  // =========================================================================
  // Enterprise-GRADE EXECUTIVE FINANCIAL AUDIT WORKBOOK EXPORT (.XLSX)
  // =========================================================================
  const handleExportExcel = async () => {
    const ledger = budget?.ledger || [];
    const categories = budget?.categories || [];
    const milestones = budget?.milestones || [];

    if (ledger.length === 0 && categories.length === 0 && milestones.length === 0) {
      if (showToast) showToast('No financial records available to export', 'error');
      return;
    }

    try {
      if (showToast) showToast('Generating Enterprise-Grade Financial Audit Workbook...', 'info');

      const ExcelJSModule = await import('exceljs');
      const ExcelJS = ExcelJSModule.default || ExcelJSModule;
      const wb = new ExcelJS.Workbook();
      wb.creator = 'VPM Platform - AI Program & Financial Intelligence';
      wb.lastModifiedBy = user?.name || 'Dipak Saha (PMO Lead)';
      wb.created = new Date();
      wb.modified = new Date();

      // Corporate Enterprise Audit Palette (PwC Brand Standard)
      const CORP_NAVY_DARK = '404041';     // PwC Charcoal
      const CORP_SLATE_HEADER = '404041';  // PwC Charcoal
      const CORP_ORANGE_ACCENT = 'D04A02'; // PwC Orange
      const CORP_LIGHT_BG = 'F2F2F2';      // PwC Light Grey (Zebra)
      const CORP_SECTION_BG = 'EBEBEB';    // PwC Section Banner Fill
      const CORP_BORDER_COLOR = 'DEDEDE';  // PwC Border Grey
      const CORP_RED_TEXT = 'E0301E';      // PwC Rose (Overrun)
      const CORP_RED_BG = 'FCE8E6';        // Soft Rose BG
      const CORP_GREEN_TEXT = '008244';    // Favorable green text
      const CORP_GREEN_BG = 'E6F3ED';      // Favorable green fill

      const thinBorder = {
        top: { style: 'thin', color: { argb: 'FF' + CORP_BORDER_COLOR } },
        left: { style: 'thin', color: { argb: 'FF' + CORP_BORDER_COLOR } },
        bottom: { style: 'thin', color: { argb: 'FF' + CORP_BORDER_COLOR } },
        right: { style: 'thin', color: { argb: 'FF' + CORP_BORDER_COLOR } }
      };

      const doubleBottomBorder = {
        top: { style: 'thin', color: { argb: 'FF' + CORP_SLATE_HEADER } },
        left: { style: 'thin', color: { argb: 'FF' + CORP_BORDER_COLOR } },
        bottom: { style: 'double', color: { argb: 'FF' + CORP_NAVY_DARK } },
        right: { style: 'thin', color: { argb: 'FF' + CORP_BORDER_COLOR } }
      };

      // =========================================================================
      // WORKSHEET 1: Executive Financial Audit & Milestone Reconciliation
      // =========================================================================
      const ws1 = wb.addWorksheet('Executive Financial Audit', {
        views: [{ showGridLines: true }]
      });

      // 1. Title Banner (Merged A1:I1)
      ws1.mergeCells('A1:I1');
      const titleCell = ws1.getCell('A1');
      titleCell.value = 'VPM PLATFORM | EXECUTIVE CAPITAL EXPENDITURE & CONTRACTUAL MILESTONE AUDIT REPORT';
      titleCell.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + CORP_NAVY_DARK } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      ws1.getRow(1).height = 34;

      // Subtitle Banner (Merged A2:I2)
      ws1.mergeCells('A2:I2');
      const subTitleCell = ws1.getCell('A2');
      subTitleCell.value = 'Autonomous Program Governance, Contractual SOW Milestone Assurance & EVM Reconciliation Ledger (Enterprise Audit Standard)';
      subTitleCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FFE2E8F0' } };
      subTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + CORP_SLATE_HEADER } };
      subTitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      ws1.getRow(2).height = 22;

      // 2. Engagement Metadata Block (Rows 4 - 7)
      const metaRows = [
        ['Project Code / ID:', projectKey, '', '', 'Audit Standard:', 'GAAP / EVM Compliant (Big-4 Assurance Baseline)'],
        ['Project Name:', data?.name || 'Enterprise Project', '', '', 'Clearance Status:', 'SOW Milestones Verified'],
        ['Generation Date:', new Date().toLocaleString(), '', '', 'Financial Controller:', user?.name ? `${user.name} (${user.role || 'PMO'})` : 'PMO Lead / Finance Controller'],
        ['Reporting Currency:', 'USD ($)', '', '', 'Data Lineage:', '100% Ingested SOW & Financial Document Parse Engine']
      ];

      metaRows.forEach((row, idx) => {
        const rNum = 4 + idx;
        const rowObj = ws1.getRow(rNum);
        rowObj.height = 20;

        ws1.mergeCells(`A${rNum}:B${rNum}`);
        ws1.mergeCells(`E${rNum}:F${rNum}`);
        ws1.mergeCells(`G${rNum}:I${rNum}`);

        const lbl1 = ws1.getCell(`A${rNum}`);
        lbl1.value = row[0];
        lbl1.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF' + CORP_SLATE_HEADER } };
        lbl1.alignment = { vertical: 'middle', horizontal: 'left' };

        const val1 = ws1.getCell(`C${rNum}`);
        val1.value = row[1];
        val1.font = { name: 'Calibri', size: 10, bold: (idx === 0 || idx === 1), color: { argb: 'FF0F172A' } };
        val1.alignment = { vertical: 'middle', horizontal: 'left' };

        const lbl2 = ws1.getCell(`E${rNum}`);
        lbl2.value = row[4];
        lbl2.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF' + CORP_SLATE_HEADER } };
        lbl2.alignment = { vertical: 'middle', horizontal: 'left' };

        const val2 = ws1.getCell(`G${rNum}`);
        val2.value = row[5];
        val2.font = { name: 'Calibri', size: 10, color: { argb: 'FF0F172A' } };
        val2.alignment = { vertical: 'middle', horizontal: 'left' };
      });

      let currentRow = 8;

      // 3. SECTION 1: EXECUTIVE FINANCIAL RECONCILIATION SUMMARY
      currentRow += 2;
      ws1.mergeCells(`A${currentRow}:G${currentRow}`);
      const sec1Banner = ws1.getCell(`A${currentRow}`);
      sec1Banner.value = '1. EXECUTIVE FINANCIAL RECONCILIATION SUMMARY (GAAP / EVM)';
      sec1Banner.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F172A' } };
      sec1Banner.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + CORP_SECTION_BG } };
      sec1Banner.alignment = { vertical: 'middle', horizontal: 'left' };
      sec1Banner.border = { left: { style: 'medium', color: { argb: 'FF' + CORP_ORANGE_ACCENT } } };
      ws1.getRow(currentRow).height = 26;

      currentRow += 1;
      const sec1Headers = ['Financial Metric', 'Baseline SOW Cap ($)', 'Actual Incurred ($)', 'Net Variance ($)', 'Burn Execution Rate', 'Runway Remaining ($)', 'EVM Assurance Health'];
      const sec1HeaderRow = ws1.getRow(currentRow);
      sec1HeaderRow.height = 24;
      sec1Headers.forEach((h, i) => {
        const cell = sec1HeaderRow.getCell(i + 1);
        cell.value = h;
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + CORP_NAVY_DARK } };
        cell.alignment = { vertical: 'middle', horizontal: i === 0 ? 'left' : (i === 6 ? 'center' : 'right') };
        cell.border = thinBorder;
      });

      currentRow += 1;
      const sec1DataRow = ws1.getRow(currentRow);
      sec1DataRow.height = 22;
      const totPlanned = Number(budget.total_planned || 0);
      const totActual = Number(budget.total_actual || 0);
      const totVariance = Number(budget.variance !== undefined ? budget.variance : (totPlanned - totActual));
      const burnPct = totPlanned > 0 ? (totActual / totPlanned) : 0;
      const remaining = Number(budget.remaining || 0);

      sec1DataRow.getCell(1).value = 'Overall Project Capital';
      sec1DataRow.getCell(1).font = { name: 'Calibri', size: 10, bold: true };
      sec1DataRow.getCell(1).border = doubleBottomBorder;

      sec1DataRow.getCell(2).value = totPlanned;
      sec1DataRow.getCell(2).numFmt = '"$"#,##0.00;[Red]("$"#,##0.00);"-"';
      sec1DataRow.getCell(2).border = doubleBottomBorder;

      sec1DataRow.getCell(3).value = totActual;
      sec1DataRow.getCell(3).numFmt = '"$"#,##0.00;[Red]("$"#,##0.00);"-"';
      sec1DataRow.getCell(3).border = doubleBottomBorder;

      const varCell = sec1DataRow.getCell(4);
      varCell.value = totVariance;
      varCell.numFmt = '"$"#,##0.00;[Red]("$"#,##0.00);"-"';
      varCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: totVariance < 0 ? 'FF' + CORP_RED_TEXT : 'FF' + CORP_GREEN_TEXT } };
      varCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: totVariance < 0 ? 'FF' + CORP_RED_BG : 'FF' + CORP_GREEN_BG } };
      varCell.border = doubleBottomBorder;

      sec1DataRow.getCell(5).value = burnPct;
      sec1DataRow.getCell(5).numFmt = '0.0%';
      sec1DataRow.getCell(5).border = doubleBottomBorder;

      sec1DataRow.getCell(6).value = remaining;
      sec1DataRow.getCell(6).numFmt = '"$"#,##0.00;[Red]("$"#,##0.00);"-"';
      sec1DataRow.getCell(6).border = doubleBottomBorder;

      const statusCell = sec1DataRow.getCell(7);
      statusCell.value = budget.variance_status || (totVariance < 0 ? 'Cost Overrun Alert' : 'On Target');
      statusCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: totVariance < 0 ? 'FF' + CORP_RED_TEXT : 'FF' + CORP_GREEN_TEXT } };
      statusCell.alignment = { vertical: 'middle', horizontal: 'center' };
      statusCell.border = doubleBottomBorder;

      // 4. SECTION 2: CAPITAL EXPENDITURE BREAKDOWN BY COST DOMAIN
      currentRow += 2;
      ws1.mergeCells(`A${currentRow}:I${currentRow}`);
      const sec2Banner = ws1.getCell(`A${currentRow}`);
      sec2Banner.value = '2. CAPITAL EXPENDITURE BREAKDOWN BY COST DOMAIN (SOW RECONCILED)';
      sec2Banner.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F172A' } };
      sec2Banner.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + CORP_SECTION_BG } };
      sec2Banner.alignment = { vertical: 'middle', horizontal: 'left' };
      sec2Banner.border = { left: { style: 'medium', color: { argb: 'FF' + CORP_ORANGE_ACCENT } } };
      ws1.getRow(currentRow).height = 26;

      currentRow += 1;
      const sec2Headers = ['Domain Code', 'Cost Domain Title', 'Baseline Cap ($)', 'Actual Incurred ($)', 'Net Variance ($)', 'Variance (%)', 'Allocation Share', 'Risk Rating', 'Executive Audit Justification & Notes'];
      const sec2HeaderRow = ws1.getRow(currentRow);
      sec2HeaderRow.height = 24;
      sec2Headers.forEach((h, i) => {
        const cell = sec2HeaderRow.getCell(i + 1);
        cell.value = h;
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + CORP_SLATE_HEADER } };
        cell.alignment = { vertical: 'middle', horizontal: (i >= 2 && i <= 6) ? 'right' : (i === 0 || i === 7 ? 'center' : 'left') };
        cell.border = thinBorder;
      });

      let sumCatPlanned = 0;
      let sumCatActual = 0;
      let sumCatVariance = 0;

      categories.forEach((cat, idx) => {
        currentRow += 1;
        const row = ws1.getRow(currentRow);
        row.height = 21;
        const isZebra = idx % 2 === 1;
        const pVal = Number(cat.planned || 0);
        const aVal = Number(cat.actual || 0);
        const vVal = Number(cat.variance !== undefined ? cat.variance : (pVal - aVal));
        const varPct = pVal > 0 ? (vVal / pVal) : 0;
        const sharePct = (cat.share_pct || cat.percentage || 0) / 100;

        sumCatPlanned += pVal;
        sumCatActual += aVal;
        sumCatVariance += vVal;

        row.getCell(1).value = cat.id || cat.code || `CAT-0${idx + 1}`;
        row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

        row.getCell(2).value = cat.name || '';
        row.getCell(2).font = { name: 'Calibri', size: 10, bold: true };

        row.getCell(3).value = pVal;
        row.getCell(3).numFmt = '"$"#,##0.00;[Red]("$"#,##0.00);"-"';

        row.getCell(4).value = aVal;
        row.getCell(4).numFmt = '"$"#,##0.00;[Red]("$"#,##0.00);"-"';

        const catVarCell = row.getCell(5);
        catVarCell.value = vVal;
        catVarCell.numFmt = '"$"#,##0.00;[Red]("$"#,##0.00);"-"';
        catVarCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: vVal < 0 ? 'FF' + CORP_RED_TEXT : 'FF' + CORP_GREEN_TEXT } };
        if (vVal < 0) catVarCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + CORP_RED_BG } };

        row.getCell(6).value = varPct;
        row.getCell(6).numFmt = '0.0%';

        row.getCell(7).value = sharePct;
        row.getCell(7).numFmt = '0.0%';

        row.getCell(8).value = cat.risk_level || 'Normal';
        row.getCell(8).alignment = { vertical: 'middle', horizontal: 'center' };

        row.getCell(9).value = cat.notes || '';

        for (let col = 1; col <= 9; col++) {
          const c = row.getCell(col);
          c.border = thinBorder;
          if (isZebra && col !== 5) {
            c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + CORP_LIGHT_BG } };
          }
        }
      });

      // Domains Subtotal Row
      currentRow += 1;
      const catSubRow = ws1.getRow(currentRow);
      catSubRow.height = 22;
      catSubRow.getCell(1).value = 'SUBTOTAL_DOMAINS';
      catSubRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
      catSubRow.getCell(2).value = 'Total Cost Domains Allocation';
      catSubRow.getCell(2).font = { name: 'Calibri', size: 10, bold: true };

      catSubRow.getCell(3).value = sumCatPlanned;
      catSubRow.getCell(3).numFmt = '"$"#,##0.00;[Red]("$"#,##0.00);"-"';
      catSubRow.getCell(3).font = { name: 'Calibri', size: 10, bold: true };

      catSubRow.getCell(4).value = sumCatActual;
      catSubRow.getCell(4).numFmt = '"$"#,##0.00;[Red]("$"#,##0.00);"-"';
      catSubRow.getCell(4).font = { name: 'Calibri', size: 10, bold: true };

      const catSubVar = catSubRow.getCell(5);
      catSubVar.value = sumCatVariance;
      catSubVar.numFmt = '"$"#,##0.00;[Red]("$"#,##0.00);"-"';
      catSubVar.font = { name: 'Calibri', size: 10, bold: true, color: { argb: sumCatVariance < 0 ? 'FF' + CORP_RED_TEXT : 'FF' + CORP_GREEN_TEXT } };
      if (sumCatVariance < 0) catSubVar.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + CORP_RED_BG } };

      catSubRow.getCell(6).value = sumCatPlanned > 0 ? (sumCatVariance / sumCatPlanned) : 0;
      catSubRow.getCell(6).numFmt = '0.0%';
      catSubRow.getCell(6).font = { name: 'Calibri', size: 10, bold: true };

      catSubRow.getCell(7).value = 1.0;
      catSubRow.getCell(7).numFmt = '0.0%';
      catSubRow.getCell(7).font = { name: 'Calibri', size: 10, bold: true };

      catSubRow.getCell(8).value = 'Consolidated';
      catSubRow.getCell(8).alignment = { vertical: 'middle', horizontal: 'center' };
      catSubRow.getCell(9).value = 'Reconciled against all active expenditure domains';

      for (let col = 1; col <= 9; col++) {
        catSubRow.getCell(col).border = doubleBottomBorder;
      }

      // 5. SECTION 3: CONTRACTUAL MILESTONE CAPITAL TRANCHES & CLEARANCE
      currentRow += 2;
      ws1.mergeCells(`A${currentRow}:H${currentRow}`);
      const sec3Banner = ws1.getCell(`A${currentRow}`);
      sec3Banner.value = '3. CONTRACTUAL MILESTONE CAPITAL TRANCHES & CLEARANCE (STAGE-GATE DISBURSEMENT)';
      sec3Banner.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F172A' } };
      sec3Banner.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + CORP_SECTION_BG } };
      sec3Banner.alignment = { vertical: 'middle', horizontal: 'left' };
      sec3Banner.border = { left: { style: 'medium', color: { argb: 'FF' + CORP_ORANGE_ACCENT } } };
      ws1.getRow(currentRow).height = 26;

      currentRow += 1;
      const sec3Headers = ['Milestone Code', 'Contractual Milestone Title', 'SOW Weight (%)', 'Planned Cap ($)', 'Actual Incurred ($)', 'Tranche Variance ($)', 'Clearance Status', 'Acceptance & Verification Criteria'];
      const sec3HeaderRow = ws1.getRow(currentRow);
      sec3HeaderRow.height = 24;
      sec3Headers.forEach((h, i) => {
        const cell = sec3HeaderRow.getCell(i + 1);
        cell.value = h;
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + CORP_SLATE_HEADER } };
        cell.alignment = { vertical: 'middle', horizontal: (i >= 2 && i <= 5) ? 'right' : (i === 0 || i === 6 ? 'center' : 'left') };
        cell.border = thinBorder;
      });

      let sumMsPlanned = 0;
      let sumMsActual = 0;
      let sumMsVariance = 0;

      milestones.forEach((ms, idx) => {
        currentRow += 1;
        const row = ws1.getRow(currentRow);
        row.height = 21;
        const isZebra = idx % 2 === 1;
        const pVal = Number(ms.planned || 0);
        const aVal = Number(ms.actual || 0);
        const vVal = Number(ms.variance !== undefined ? ms.variance : (pVal - aVal));
        const wPct = (ms.percentage || 0) / 100;

        sumMsPlanned += pVal;
        sumMsActual += aVal;
        sumMsVariance += vVal;

        row.getCell(1).value = ms.code || `M${idx + 1}`;
        row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

        row.getCell(2).value = ms.name || '';
        row.getCell(2).font = { name: 'Calibri', size: 10, bold: true };

        row.getCell(3).value = wPct;
        row.getCell(3).numFmt = '0.0%';

        row.getCell(4).value = pVal;
        row.getCell(4).numFmt = '"$"#,##0.00;[Red]("$"#,##0.00);"-"';

        row.getCell(5).value = aVal;
        row.getCell(5).numFmt = '"$"#,##0.00;[Red]("$"#,##0.00);"-"';

        const msVarCell = row.getCell(6);
        msVarCell.value = vVal;
        msVarCell.numFmt = '"$"#,##0.00;[Red]("$"#,##0.00);"-"';
        msVarCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: vVal < 0 ? 'FF' + CORP_RED_TEXT : 'FF' + CORP_GREEN_TEXT } };
        if (vVal < 0) msVarCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + CORP_RED_BG } };

        row.getCell(7).value = ms.status || 'Pending';
        row.getCell(7).alignment = { vertical: 'middle', horizontal: 'center' };

        row.getCell(8).value = ms.criteria || '';

        for (let col = 1; col <= 8; col++) {
          const c = row.getCell(col);
          c.border = thinBorder;
          if (isZebra && col !== 6) {
            c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + CORP_LIGHT_BG } };
          }
        }
      });

      // Milestones Subtotal Row
      currentRow += 1;
      const msSubRow = ws1.getRow(currentRow);
      msSubRow.height = 22;
      msSubRow.getCell(1).value = 'SUBTOTAL_TRANCHES';
      msSubRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
      msSubRow.getCell(2).value = 'Total Contractual SOW Milestone Tranches';
      msSubRow.getCell(2).font = { name: 'Calibri', size: 10, bold: true };

      msSubRow.getCell(3).value = 1.0;
      msSubRow.getCell(3).numFmt = '0.0%';
      msSubRow.getCell(3).font = { name: 'Calibri', size: 10, bold: true };

      msSubRow.getCell(4).value = sumMsPlanned;
      msSubRow.getCell(4).numFmt = '"$"#,##0.00;[Red]("$"#,##0.00);"-"';
      msSubRow.getCell(4).font = { name: 'Calibri', size: 10, bold: true };

      msSubRow.getCell(5).value = sumMsActual;
      msSubRow.getCell(5).numFmt = '"$"#,##0.00;[Red]("$"#,##0.00);"-"';
      msSubRow.getCell(5).font = { name: 'Calibri', size: 10, bold: true };

      const msSubVar = msSubRow.getCell(6);
      msSubVar.value = sumMsVariance;
      msSubVar.numFmt = '"$"#,##0.00;[Red]("$"#,##0.00);"-"';
      msSubVar.font = { name: 'Calibri', size: 10, bold: true, color: { argb: sumMsVariance < 0 ? 'FF' + CORP_RED_TEXT : 'FF' + CORP_GREEN_TEXT } };
      if (sumMsVariance < 0) msSubVar.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + CORP_RED_BG } };

      msSubRow.getCell(7).value = 'Consolidated';
      msSubRow.getCell(7).alignment = { vertical: 'middle', horizontal: 'center' };
      msSubRow.getCell(8).value = 'Verified against contractual SOW release criteria';

      for (let col = 1; col <= 8; col++) {
        msSubRow.getCell(col).border = doubleBottomBorder;
      }

      // Explicit auto-fit widths for Sheet 1
      ws1.getColumn(1).width = 20;
      ws1.getColumn(2).width = 45;
      ws1.getColumn(3).width = 22;
      ws1.getColumn(4).width = 22;
      ws1.getColumn(5).width = 22;
      ws1.getColumn(6).width = 20;
      ws1.getColumn(7).width = 22;
      ws1.getColumn(8).width = 20;
      ws1.getColumn(9).width = 50;

      // =========================================================================
      // WORKSHEET 2: Granular Itemized Expenditure Transaction Ledger
      // =========================================================================
      const ws2 = wb.addWorksheet('Itemized Transaction Ledger', {
        views: [{ showGridLines: true }]
      });

      // Title Banner (Merged A1:O1)
      ws2.mergeCells('A1:O1');
      const ws2Title = ws2.getCell('A1');
      ws2Title.value = `ITEMIZED CAPITAL EXPENDITURE & TRANSACTION AUDIT LEDGER (${ledger.length} VERIFIED LINE ITEMS)`;
      ws2Title.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
      ws2Title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + CORP_NAVY_DARK } };
      ws2Title.alignment = { vertical: 'middle', horizontal: 'center' };
      ws2.getRow(1).height = 32;

      // Header Row
      const ledgerHeaders = [
        'Line ID', 'Invoice Number', 'PO Number', 'Expense Item Description', 
        'Cost Domain', 'Vendor / Beneficiary', 'Cost Center', 'GL Code', 
        'Posting Date', 'Planned Cap ($)', 'Actual Incurred ($)', 'Net Variance ($)', 
        'Audit Status', 'Authorized Approver', 'Audit Remarks & Notes'
      ];
      const ledgerHeaderRow = ws2.getRow(3);
      ledgerHeaderRow.height = 25;
      ledgerHeaders.forEach((h, i) => {
        const cell = ledgerHeaderRow.getCell(i + 1);
        cell.value = h;
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + CORP_SLATE_HEADER } };
        cell.alignment = { vertical: 'middle', horizontal: (i >= 9 && i <= 11) ? 'right' : (i <= 2 || i === 6 || i === 7 || i === 8 || i === 12 ? 'center' : 'left') };
        cell.border = thinBorder;
      });

      let ledgerRowIdx = 4;
      let sumLedgerPlanned = 0;
      let sumLedgerActual = 0;
      let sumLedgerVariance = 0;

      ledger.forEach((item, idx) => {
        const row = ws2.getRow(ledgerRowIdx);
        row.height = 20;
        const isZebra = idx % 2 === 1;

        const pVal = Number(item.planned || 0);
        const aVal = Number(item.actual || 0);
        const vVal = Number(item.variance !== undefined ? item.variance : (pVal - aVal));

        sumLedgerPlanned += pVal;
        sumLedgerActual += aVal;
        sumLedgerVariance += vVal;

        row.getCell(1).value = item.id || '';
        row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

        row.getCell(2).value = item.invoice_no || '';
        row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };

        row.getCell(3).value = item.po_number || '';
        row.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };

        row.getCell(4).value = item.title || '';
        row.getCell(4).font = { name: 'Calibri', size: 10, bold: true };

        row.getCell(5).value = item.category || '';
        row.getCell(6).value = item.vendor || '';

        row.getCell(7).value = item.cost_center || '';
        row.getCell(7).alignment = { vertical: 'middle', horizontal: 'center' };

        row.getCell(8).value = item.gl_code || '';
        row.getCell(8).alignment = { vertical: 'middle', horizontal: 'center' };

        row.getCell(9).value = item.date || '';
        row.getCell(9).alignment = { vertical: 'middle', horizontal: 'center' };

        row.getCell(10).value = pVal;
        row.getCell(10).numFmt = '"$"#,##0.00;[Red]("$"#,##0.00);"-"';

        row.getCell(11).value = aVal;
        row.getCell(11).numFmt = '"$"#,##0.00;[Red]("$"#,##0.00);"-"';

        const lVarCell = row.getCell(12);
        lVarCell.value = vVal;
        lVarCell.numFmt = '"$"#,##0.00;[Red]("$"#,##0.00);"-"';
        lVarCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: vVal < 0 ? 'FF' + CORP_RED_TEXT : 'FF' + CORP_GREEN_TEXT } };
        if (vVal < 0) lVarCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + CORP_RED_BG } };

        row.getCell(13).value = item.status || '';
        row.getCell(13).alignment = { vertical: 'middle', horizontal: 'center' };

        row.getCell(14).value = item.approver || '';
        row.getCell(15).value = item.notes || '';

        for (let col = 1; col <= 15; col++) {
          const c = row.getCell(col);
          c.border = thinBorder;
          if (isZebra && col !== 12) {
            c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + CORP_LIGHT_BG } };
          }
        }

        ledgerRowIdx++;
      });

      // Grand Total Row for Ledger
      const totalLedgerRow = ws2.getRow(ledgerRowIdx);
      totalLedgerRow.height = 24;
      totalLedgerRow.getCell(4).value = `GRAND TOTAL (${ledger.length} TRANSACTIONS)`;
      totalLedgerRow.getCell(4).font = { name: 'Calibri', size: 10, bold: true };

      totalLedgerRow.getCell(10).value = sumLedgerPlanned;
      totalLedgerRow.getCell(10).numFmt = '"$"#,##0.00;[Red]("$"#,##0.00);"-"';
      totalLedgerRow.getCell(10).font = { name: 'Calibri', size: 10, bold: true };

      totalLedgerRow.getCell(11).value = sumLedgerActual;
      totalLedgerRow.getCell(11).numFmt = '"$"#,##0.00;[Red]("$"#,##0.00);"-"';
      totalLedgerRow.getCell(11).font = { name: 'Calibri', size: 10, bold: true };

      const grandVar = totalLedgerRow.getCell(12);
      grandVar.value = sumLedgerVariance;
      grandVar.numFmt = '"$"#,##0.00;[Red]("$"#,##0.00);"-"';
      grandVar.font = { name: 'Calibri', size: 10, bold: true, color: { argb: sumLedgerVariance < 0 ? 'FF' + CORP_RED_TEXT : 'FF' + CORP_GREEN_TEXT } };
      if (sumLedgerVariance < 0) grandVar.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + CORP_RED_BG } };

      for (let col = 1; col <= 15; col++) {
        totalLedgerRow.getCell(col).border = doubleBottomBorder;
      }

      // Column widths on Sheet 2
      const ws2ColWidths = [12, 16, 14, 34, 26, 26, 14, 14, 14, 18, 18, 18, 16, 18, 40];
      ws2ColWidths.forEach((w, i) => {
        ws2.getColumn(i + 1).width = w;
      });

      // Generate binary buffer and download
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${projectKey}_Enterprise_Executive_Financial_Audit_Report.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      if (showToast) {
        showToast('Enterprise Executive Financial Audit Workbook exported successfully (.xlsx)!', 'success');
      }
    } catch (err) {
      console.error('Failed to export Enterprise Excel report:', err);
      if (showToast) showToast('Failed to generate Excel report. Downloading CSV fallback...', 'error');
      handleExportBudgetCSV();
    }
  };

  const handleExportBudgetCSV = () => {
    const ledger = budget?.ledger || [];
    const categories = budget?.categories || [];
    const milestones = budget?.milestones || [];
    
    if (ledger.length === 0 && categories.length === 0 && milestones.length === 0) {
      if (showToast) showToast('No financial records available to export', 'error');
      return;
    }

    // Helper for safe CSV cell escaping
    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const clean = String(str).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const lines = [];

    // 1. EXECUTIVE PMO AUDIT HEADER
    lines.push(escapeCsv("VPM AI PLATFORM - CAPITAL EXPENDITURE & CONTRACTUAL MILESTONE RECONCILIATION AUDIT REPORT"));
    lines.push(`"PROJECT ID",${escapeCsv(projectKey)},"PROJECT NAME",${escapeCsv(data?.name || 'Enterprise Project')}`);
    lines.push(`"GENERATION TIMESTAMP",${escapeCsv(new Date().toISOString())},"AUDIT STANDARD","GAAP / EVM Compliant"`);
    lines.push(`"REPORTING CURRENCY","USD ($)","DATA SOURCE","100% Ingested SOW & Financial Document Parse Engine"`);
    lines.push(`"GENERATED BY",${escapeCsv(user?.name ? `${user.name} (${user.role || 'PMO Lead'})` : 'PMO Lead / Financial Controller')}`);
    lines.push("");

    // 2. EXECUTIVE FINANCIAL RECONCILIATION SUMMARY
    lines.push(escapeCsv("=== EXECUTIVE FINANCIAL RECONCILIATION SUMMARY ==="));
    lines.push(["Metric", "Baseline SOW Cap ($)", "Actual Incurred ($)", "Net Variance ($)", "Burn Execution Rate (%)", "Runway Remaining ($)", "EVM Health Status"].map(escapeCsv).join(','));
    lines.push([
      escapeCsv("Overall Project Capital"),
      budget.total_planned || 0,
      budget.total_actual || 0,
      budget.variance || 0,
      `${budget.burn_percentage || 0}%`,
      budget.remaining || 0,
      escapeCsv(budget.variance_status || (budget.variance < 0 ? 'Cost Overrun Alert' : 'On Target'))
    ].join(','));
    lines.push("");

    // 3. SECTION 1: CAPITAL EXPENDITURE BREAKDOWN BY COST DOMAIN
    lines.push(escapeCsv("=== SECTION 1: CAPITAL EXPENDITURE BREAKDOWN BY COST DOMAIN ==="));
    lines.push([
      "Domain Code",
      "Cost Domain Title",
      "Baseline Cap ($)",
      "Actual Incurred ($)",
      "Net Variance ($)",
      "Variance (%)",
      "Allocation Share (%)",
      "Risk Rating",
      "Executive Audit Notes"
    ].map(escapeCsv).join(','));

    let totalCatPlanned = 0;
    let totalCatActual = 0;
    let totalCatVariance = 0;

    categories.forEach(cat => {
      totalCatPlanned += Number(cat.planned || 0);
      totalCatActual += Number(cat.actual || 0);
      totalCatVariance += Number(cat.variance || 0);
      lines.push([
        escapeCsv(cat.id || ''),
        escapeCsv(cat.name || ''),
        cat.planned || 0,
        cat.actual || 0,
        cat.variance || 0,
        escapeCsv(cat.variance_pct !== undefined ? `${cat.variance_pct}%` : `${cat.percentage || 0}%`),
        escapeCsv(`${cat.percentage || 0}%`),
        escapeCsv(cat.risk_level || 'Normal'),
        escapeCsv(cat.notes || '')
      ].join(','));
    });

    lines.push([
      escapeCsv("SUBTOTAL_DOMAINS"),
      escapeCsv("Total Cost Domains Allocation"),
      totalCatPlanned,
      totalCatActual,
      totalCatVariance,
      escapeCsv(totalCatPlanned > 0 ? `${((totalCatVariance / totalCatPlanned) * 100).toFixed(1)}%` : '0%'),
      escapeCsv("100%"),
      escapeCsv("Consolidated"),
      escapeCsv("Reconciled against all active expenditure domains")
    ].join(','));
    lines.push("");

    // 4. SECTION 2: CONTRACTUAL MILESTONE CAPITAL TRANCHES & CLEARANCE
    lines.push(escapeCsv("=== SECTION 2: CONTRACTUAL MILESTONE CAPITAL TRANCHES & CLEARANCE ==="));
    lines.push([
      "Milestone Code",
      "Contractual Milestone Title",
      "SOW Weight (%)",
      "Planned Cap ($)",
      "Actual Incurred ($)",
      "Tranche Variance ($)",
      "Clearance Status",
      "Acceptance & Verification Criteria"
    ].map(escapeCsv).join(','));

    let totalMsPlanned = 0;
    let totalMsActual = 0;
    let totalMsVariance = 0;

    milestones.forEach(ms => {
      totalMsPlanned += Number(ms.planned || 0);
      totalMsActual += Number(ms.actual || 0);
      totalMsVariance += Number(ms.variance || 0);
      lines.push([
        escapeCsv(ms.code || ''),
        escapeCsv(ms.name || ''),
        escapeCsv(`${ms.percentage || 0}%`),
        ms.planned || 0,
        ms.actual || 0,
        ms.variance || 0,
        escapeCsv(ms.status || 'Pending'),
        escapeCsv(ms.criteria || '')
      ].join(','));
    });

    lines.push([
      escapeCsv("SUBTOTAL_TRANCHES"),
      escapeCsv("Total Contractual SOW Milestone Tranches"),
      escapeCsv("100%"),
      totalMsPlanned,
      totalMsActual,
      totalMsVariance,
      escapeCsv("Consolidated Tranches"),
      escapeCsv("Verified against contractual SOW release criteria")
    ].join(','));
    lines.push("");

    // 5. SECTION 3: ITEMISED CAPITAL EXPENDITURE TRANSACTION LEDGER
    lines.push(escapeCsv(`=== SECTION 3: ITEMISED EXPENDITURE TRANSACTION LEDGER (${ledger.length} Verified Lines) ===`));
    lines.push([
      "Line ID",
      "Invoice Number",
      "Purchase Order (PO)",
      "Expense Description",
      "Cost Domain",
      "Vendor / Beneficiary",
      "Cost Center",
      "GL Account Code",
      "Transaction Date",
      "Planned Cap ($)",
      "Actual Incurred ($)",
      "Net Variance ($)",
      "Audit Clearance Status",
      "Authorized Approver",
      "Audit Notes & Justification"
    ].map(escapeCsv).join(','));

    ledger.forEach(item => {
      lines.push([
        escapeCsv(item.id || ''),
        escapeCsv(item.invoice_no || ''),
        escapeCsv(item.po_number || ''),
        escapeCsv(item.title || ''),
        escapeCsv(item.category || ''),
        escapeCsv(item.vendor || ''),
        escapeCsv(item.cost_center || ''),
        escapeCsv(item.gl_code || ''),
        escapeCsv(item.date || ''),
        item.planned || 0,
        item.actual || 0,
        item.variance || 0,
        escapeCsv(item.status || ''),
        escapeCsv(item.approver || ''),
        escapeCsv(item.notes || '')
      ].join(','));
    });

    // 6. UTF-8 BOM AND BLOB DOWNLOAD
    const csvString = "\uFEFF" + lines.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${projectKey}_Financial_Audit_Reconciliation_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (showToast) {
      showToast(`Exported ${ledger.length} ledger lines & ${categories.length} domain tranches`, 'success');
    }
  };

  const getCategoryIcon = (iconName) => {
    switch (iconName) {
      case 'Code': return <Code size={16} />;
      case 'Building2': return <Building2 size={16} />;
      case 'Server': return <Server size={16} />;
      case 'Cpu': return <Cpu size={16} />;
      case 'ShieldCheck': return <ShieldCheck size={16} />;
      default: return <PieChart size={16} />;
    }
  };

  const filteredLedger = (budget?.ledger || []).filter(item => {
    const matchesCategory = budgetCategoryFilter === 'all' || 
      item.category_id === budgetCategoryFilter || 
      (item.category && item.category.toLowerCase().includes(budgetCategoryFilter.toLowerCase()));
    
    const matchesStatus = budgetStatusFilter === 'all' 
      ? true 
      : (budgetStatusFilter === 'flagged' ? (item.variance < 0) : (item.status && item.status.toLowerCase().includes(budgetStatusFilter.toLowerCase())));

    const term = budgetSearchTerm.toLowerCase().trim();
    const matchesSearch = !term || 
      (item.title && item.title.toLowerCase().includes(term)) ||
      (item.vendor && item.vendor.toLowerCase().includes(term)) ||
      (item.invoice_no && item.invoice_no.toLowerCase().includes(term)) ||
      (item.cost_center && item.cost_center.toLowerCase().includes(term)) ||
      (item.id && item.id.toLowerCase().includes(term));

    return matchesCategory && matchesStatus && matchesSearch;
  });

  const getSectionOrder = (sectionId) => {
    if (user?.role === 'Investor') {
      const investorOrder = { kpi: 1, completion: 2, budget: 3, schedule: 4, governance: 5, charts: 6, team: 7, threats: 8 };
      return investorOrder[sectionId] || 99;
    }
    if (user?.role === 'Project Manager') {
      const pmOrder = { kpi: 1, team: 2, schedule: 3, threats: 4, charts: 5, budget: 6, governance: 7 };
      return pmOrder[sectionId] || 99;
    }
    if (user?.role === 'PMO' || user?.role === 'Program Director') {
      const pmoOrder = { kpi: 1, budget: 2, governance: 3, schedule: 4, charts: 5, threats: 6, team: 7 };
      return pmoOrder[sectionId] || 99;
    }
    const defaultOrder = { kpi: 1, team: 2, budget: 3, schedule: 4, governance: 5, charts: 6, threats: 7 };
    return defaultOrder[sectionId] || 99;
  };

  return (
    <div className="py-2 space-y-6 animate-fadeIn">
      
      {/* 1. TOP CONTEXTUAL BREADCRUMBS & NAVIGATION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-white/10">
        <nav className="flex items-center gap-2 text-xs font-semibold theme-muted overflow-x-auto whitespace-nowrap py-1">
          <Link 
            to="/dashboard" 
            className="hover:text-[#FF5A14] transition-colors flex items-center gap-1.5"
            title="Return to Main Persona Dashboard"
          >
            <Layers size={13} className="text-[#FF5A14]" />
            <span>{getPersonaDashboardLabel()}</span>
          </Link>

          <ChevronRight size={13} className="text-slate-500 dark:text-slate-600 flex-shrink-0" />

          <Link 
            to="/projects" 
            className="hover:text-[#FF5A14] transition-colors"
          >
            Projects Hub
          </Link>

          <ChevronRight size={13} className="text-slate-500 dark:text-slate-600 flex-shrink-0" />

          <Link 
            to="/dashboard" 
            className="hover:text-[#FF5A14] transition-colors"
          >
            Dashboard
          </Link>

          <ChevronRight size={13} className="text-slate-500 dark:text-slate-600 flex-shrink-0" />

          <span className="text-[#FF5A14] font-bold font-mono flex items-center gap-1.5">
            <span>[{projectKey}]</span>
            <span className="theme-heading font-sans font-bold">{data.name}</span>
          </span>
        </nav>

        {/* Back Button */}
        <button 
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl theme-subtle border theme-border hover:border-[#FF5A14]/50 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all self-start sm:self-auto cursor-pointer"
        >
          <ArrowLeft size={13} className="text-[#FF5A14]" />
          <span>Back to Dashboard</span>
        </button>
      </div>

      {/* 2. PROJECT TITLE & TELEMETRY BADGES */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#FF5A14]/15 text-[#FF5A14] border border-[#FF5A14]/30">
              Level 3 Drilldown: Project Workspace
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
              data.status === 'Active' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
              'bg-blue-500/15 text-blue-400 border border-blue-500/30'
            }`}>
              {data.status || 'Active'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black theme-heading tracking-tight flex items-center gap-3">
            <span>{data.name}</span>
            <span className="text-sm font-mono px-2.5 py-1 rounded-lg bg-[#FF5A14]/10 text-[#FF7A45] border border-[#FF5A14]/20">
              {projectKey}
            </span>
          </h1>
          <p className="text-xs sm:text-sm theme-muted mt-1">
            Program engagement telemetry, deliverable burn curve, and role allocations calibrated for project ID: {projectKey}.
          </p>
        </div>

        {/* Quick Link to Team Member View */}
        <button
          onClick={() => navigate(`/project/${projectNumericId}/team-members`)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white text-xs font-bold shadow-md hover:brightness-110 transition-all inline-flex items-center gap-2 self-start md:self-auto cursor-pointer flex-shrink-0"
        >
          <Users size={15} />
          <span>View Team Roster ({totalResources})</span>
          <ArrowRight size={13} />
        </button>
      </div>

      {/* TAB NAVIGATION: QUICK LEVEL 4 DRILLDOWN FILTERS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b theme-border text-xs font-bold whitespace-nowrap no-scrollbar">
        <span className="theme-muted text-[11px] uppercase tracking-wider flex items-center gap-1 mr-1">
          <Filter size={12} className="text-[#FF5A14]" />
          <span>Drilldown Focus:</span>
        </span>
        <button
          onClick={() => handleTabChange('all')}
          className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
            currentTab === 'all'
              ? 'bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white shadow-md'
              : 'theme-subtle hover:bg-white/5 theme-muted'
          }`}
        >
          All Overview
        </button>
        {user?.role !== 'Investor' && (
        <button
          onClick={() => handleTabChange('team')}
          className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            currentTab === 'team'
              ? 'bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white shadow-md'
              : 'theme-subtle hover:bg-white/5 theme-muted'
          }`}
        >
          <Users size={13} />
          <span>Team & Contributors</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-black/25 font-mono">L4</span>
        </button>
        )}
        {user?.role !== 'Project Manager' && (
        <button
          onClick={() => handleTabChange('budget')}
          className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            currentTab === 'budget'
              ? 'bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white shadow-md'
              : 'theme-subtle hover:bg-white/5 theme-muted'
          }`}
        >
          <DollarSign size={13} />
          <span>Budget & Capital</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-black/25 font-mono">L4</span>
        </button>
        )}
        <button
          onClick={() => handleTabChange('schedule')}
          className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            currentTab === 'schedule'
              ? 'bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white shadow-md'
              : 'theme-subtle hover:bg-white/5 theme-muted'
          }`}
        >
          <Calendar size={13} />
          <span>Estimated Deadline</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-black/25 font-mono">L4</span>
        </button>
        <button
          onClick={() => handleTabChange('tasks')}
          className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            currentTab === 'tasks'
              ? 'bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white shadow-md'
              : 'theme-subtle hover:bg-white/5 theme-muted'
          }`}
        >
          <CheckCircle2 size={13} />
          <span>Task Backlog</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-black/25 font-mono">L4</span>
        </button>
        <button
          onClick={() => handleTabChange('governance')}
          className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            currentTab === 'governance'
              ? 'bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white shadow-md'
              : 'theme-subtle hover:bg-white/5 theme-muted'
          }`}
        >
          <ShieldCheck size={13} />
          <span>Vendor SLA & Governance</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-black/25 font-mono">L4</span>
        </button>

        {/* Level 4 Drilldown Tab: Project Completion & Delivery Velocity (Investor Persona Exclusive) */}
        {user?.role === 'Investor' && (
          <button
            onClick={() => handleTabChange('completion')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              currentTab === 'completion'
                ? 'bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white shadow-md'
                : 'theme-subtle hover:bg-white/5 theme-muted'
            }`}
          >
            <CheckCircle2 size={13} />
            <span>Completion & Velocity</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-black/25 font-mono">L4</span>
          </button>
        )}

        {/* Threat Register Tab - Commented out / Hidden for Investor Persona */}
        {user?.role !== 'Investor' && (
          <button
            onClick={() => handleTabChange('threats')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              currentTab === 'threats'
                ? 'bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white shadow-md'
                : 'theme-subtle hover:bg-white/5 theme-muted'
            }`}
          >
            <AlertTriangle size={13} />
            <span>Threat Register</span>
          </button>
        )}
      </div>

      <div className="flex flex-col space-y-6">

      {/* 3. EXECUTIVE KPIS GRID (Visible in All or Overview) */}
      {(currentTab === 'all' || currentTab === 'budget' || (user?.role === 'Investor' && currentTab === 'completion')) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-2" style={{ order: getSectionOrder('kpi') }}>
          {currentTab === 'budget' ? (
            <>
              <KPICard 
                title="TOTAL BUDGET COMMITMENT"
                value={fmtMoney(budget.planned)}
                trend="neutral"
                trendLabel="Approved SOW Baseline"
                icon={<DollarSign size={18} />}
              />
              <KPICard 
                title="ACTUAL CAPITAL INVOICED"
                value={fmtMoney(budget.actual)}
                trend={budget.variance >= 0 ? "neutral" : "down"}
                trendLabel={`${budget.burn_pct || 0}% Burn Rate`}
                icon={<CreditCard size={18} />}
              />
              <KPICard 
                title="COST PERFORMANCE INDEX (CPI)"
                value={budget.cpi ? `${budget.cpi}x` : '1.00x'}
                trend={(budget.cpi || 1) >= 1 ? "up" : "down"}
                trendLabel={budget.variance >= 0 ? `+${fmtMoney(budget.variance)} Surplus` : `-${fmtMoney(Math.abs(budget.variance))} Deficit`}
                icon={<TrendingUp size={18} />}
              />
              <KPICard 
                title="PROJECT HEALTH"
                value={((data.kpis || []).find(k => k.title.toLowerCase().includes('health'))?.value) || '0%'}
                trend={((data.kpis || []).find(k => k.title.toLowerCase().includes('health'))?.trend) || 'neutral'}
                trendLabel={((data.kpis || []).find(k => k.title.toLowerCase().includes('health'))?.trendLabel) || 'At Risk'}
                icon={<CheckCircle2 size={18} />}
              />
            </>
          ) : (
            (data.kpis || []).map((kpi, idx) => {
              const titleLower = (kpi.title || '').toLowerCase();
              const isRisk = titleLower.includes('risk') || idx === 2;
              const isInvestor = user?.role === 'Investor';

              if (isInvestor && isRisk) {
                return (
                  <KPICard 
                    key={idx}
                    title="PROJECT COMPLETION"
                    value={`${completion.percentage}%`}
                    trend={completion.percentage > 0 ? "up" : "neutral"}
                    trendLabel={completion.label}
                    icon={<CheckCircle2 size={18} />}
                  />
                );
              }

              return (
                <KPICard 
                  key={idx}
                  title={kpi.title} 
                  value={kpi.value} 
                  trend={kpi.trend} 
                  trendLabel={kpi.trendLabel}
                  icon={
                    idx === 0 ? <DollarSign size={18} /> :
                    idx === 1 ? <TrendingUp size={18} /> :
                    idx === 2 ? <ShieldCheck size={18} /> :
                    <Sparkles size={18} />
                  }
                />
              );
            })
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. LEVEL 4: TEAM & CONTRIBUTORS — ROLE-WISE RESOURCE ALLOCATION */}
      {/* ========================================================================= */}
      {(currentTab === 'all' || currentTab === 'team') && user?.role !== 'Investor' && (
        <div id="team-contributors" className="p-6 rounded-3xl theme-card border border-[#FF5A14]/25 shadow-lg space-y-4" style={{ order: getSectionOrder('team') }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b theme-border">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-[#FF5A14]/15 text-[#FF5A14]">
                <Users size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold theme-heading">TEAM & CONTRIBUTORS</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FF5A14]/15 text-[#FF5A14] border border-[#FF5A14]/30 font-bold uppercase">
                    Level 4 Drilldown
                  </span>
                </div>
                <p className="text-xs theme-muted">Role-wise headcount distribution — Click any role to drill into team members</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 size={13} />
                <span>Total Resources: {totalResources} Staff</span>
              </span>
              <button
                onClick={() => navigate(`/project/${projectNumericId}/team-members`)}
                className="text-xs font-bold text-[#FF5A14] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>View All</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>

          {/* Role Distribution Clickable Tiles */}
          {rolesList.length === 0 ? (
            <div className="py-6 text-center text-xs theme-muted italic">
              No team members currently allocated to this workspace.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 pt-1">
              {rolesList.map((roleItem, rIdx) => {
                const rColor = roleItem.color || '#FF5A14';
                const targetUrl = `/project/${projectNumericId}/team-members?role=${encodeURIComponent(roleItem.role)}`;
                return (
                  <Link
                    key={rIdx}
                    to={targetUrl}
                    className="p-4 rounded-2xl theme-subtle border theme-border hover:border-[#FF5A14]/60 hover:bg-[#FF5A14]/5 transition-all cursor-pointer group flex flex-col justify-between block text-inherit no-underline"
                    title={`Click to view all ${roleItem.role} contributors`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span 
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: rColor }}
                        ></span>
                        <span className="text-[11px] font-mono font-bold theme-muted">
                          {roleItem.allocation_pct}% Pod
                        </span>
                      </div>

                      <h4 className="text-sm font-bold theme-heading group-hover:text-[#FF7A45] transition-colors line-clamp-1" title={roleItem.role}>
                        {roleItem.role}
                      </h4>
                    </div>

                    <div className="pt-3 mt-2 border-t theme-border flex items-center justify-between">
                      <span className="text-xl font-black theme-heading font-mono">
                        {roleItem.count} <span className="text-[11px] font-normal theme-muted font-sans">{roleItem.count === 1 ? 'Resource' : 'Resources'}</span>
                      </span>
                      <span className="text-xs font-bold text-[#FF5A14] group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
                        <span>View</span>
                        <ArrowRight size={12} />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. LEVEL 4: TOTAL BUDGET & CAPITAL — SPEND TRAJECTORY & FINANCIALS */}
      {/* ========================================================================= */}
      {(currentTab === 'all' || currentTab === 'budget') && user?.role !== 'Project Manager' && (
        <div id="budget-breakdown" className="p-6 rounded-3xl theme-card border border-[#FF5A14]/25 shadow-lg space-y-5" style={{ order: getSectionOrder('budget') }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b theme-border">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400">
                <DollarSign size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold theme-heading">TOTAL BUDGET & CAPITAL</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold uppercase">
                    Level 4 Drilldown
                  </span>
                </div>
                <p className="text-xs theme-muted">Capital burn velocity, monthly run-rate & expenditure trajectory</p>
              </div>
            </div>

            <Link
              to="/reports"
              className="text-xs font-bold text-[#FF5A14] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Full Financial Briefings</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          {/* 4 Financial Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl theme-subtle border theme-border text-center">
              <span className="theme-muted block text-[10px] uppercase font-bold tracking-wider">Planned Baseline</span>
              <span className="text-xl sm:text-2xl font-black theme-heading font-mono mt-1 block">
                {fmtMoney(budget.planned)}
              </span>
              <span className="text-[10px] theme-muted mt-0.5 block">Approved Contract Cap</span>
            </div>

            <div className="p-4 rounded-2xl theme-subtle border theme-border text-center">
              <span className="theme-muted block text-[10px] uppercase font-bold tracking-wider">Actual Spend</span>
              <span className="text-xl sm:text-2xl font-black text-[#FF5A14] font-mono mt-1 block">
                {fmtMoney(budget.actual)}
              </span>
              <span className="text-[10px] font-mono text-[#FF7A45] mt-0.5 block">{budget.burn_pct}% Burned</span>
            </div>

            <div className="p-4 rounded-2xl theme-subtle border theme-border text-center">
              <span className="theme-muted block text-[10px] uppercase font-bold tracking-wider">Remaining Capital</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-1 block">
                {fmtMoney(budget.remaining)}
              </span>
              <span className="text-[10px] text-emerald-500 mt-0.5 block">Available Runway</span>
            </div>

            <div className="p-4 rounded-2xl theme-subtle border theme-border text-center">
              <span className="theme-muted block text-[10px] uppercase font-bold tracking-wider">Cost Variance</span>
              <span className={`text-xl sm:text-2xl font-black font-mono mt-1 block ${budget.variance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {budget.variance >= 0 ? `+${fmtMoney(budget.variance)}` : `-${fmtMoney(Math.abs(budget.variance))}`}
              </span>
              <span className="text-[10px] font-bold text-emerald-500 mt-0.5 block">
                {budget.variance_status} Trajectory
              </span>
            </div>
          </div>

          {/* Velocity Progress Bar & Metrics */}
          <div className="p-4 rounded-2xl theme-subtle border theme-border grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div>
              <span className="text-[11px] theme-muted uppercase font-bold block">Monthly Burn Rate</span>
              <span className="text-sm font-black theme-heading font-mono mt-0.5 block">
                {fmtMoney(budget.monthly_run_rate)} / month
              </span>
            </div>
            <div>
              <span className="text-[11px] theme-muted uppercase font-bold block">Cost Perf. Index (CPI)</span>
              <span className="text-sm font-black text-emerald-400 font-mono mt-0.5 block">
                {budget.cpi} Favorable
              </span>
            </div>
            <div>
              <div className="flex justify-between text-[11px] mb-1 font-mono font-bold">
                <span className="theme-muted">Burn Velocity:</span>
                <span className="text-[#FF5A14]">{budget.burn_pct}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] transition-all duration-500"
                  style={{ width: `${Math.min(100, budget.burn_pct)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 5.1 COST CATEGORIES BREAKDOWN (WHERE MONEY IS ALLOCATED & SPENT)           */}
          {/* ========================================================================= */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider theme-muted flex items-center gap-2">
                  <PieChart size={14} className="text-[#FF5A14]" />
                  <span>Capital Expenditure Breakdown by Cost Domain</span>
                </h4>
                <p className="text-[11px] theme-muted mt-0.5">
                  Click any category tile to filter the itemized expenditure ledger below
                </p>
              </div>

              {budgetCategoryFilter !== 'all' && (
                <button
                  onClick={() => setBudgetCategoryFilter('all')}
                  className="px-2.5 py-1 rounded-lg bg-[#FF5A14]/15 text-[#FF5A14] text-[11px] font-bold border border-[#FF5A14]/30 hover:bg-[#FF5A14]/25 transition-all self-start sm:self-auto cursor-pointer flex items-center gap-1"
                >
                  <X size={12} />
                  <span>Reset Category Filter</span>
                </button>
              )}
            </div>

            {(!budget.categories || budget.categories.length === 0) ? (
              <div className="py-6 text-center text-xs theme-muted italic border theme-border rounded-2xl bg-slate-50/50 dark:bg-white/[0.02]">
                No budget category breakdown tables found in uploaded contract documents.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 pt-1">
                {budget.categories.map((cat) => {
                  const isSelected = budgetCategoryFilter === cat.id;
                  const isOver = cat.variance < 0;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => setSelectedDomainModal(cat)}
                      className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between group hover:shadow-lg hover:scale-[1.01] ${
                        isSelected 
                          ? 'bg-[#FF5A14]/10 border-[#FF5A14] shadow-[0_0_15px_rgba(255,90,20,0.15)] ring-1 ring-[#FF5A14]'
                          : 'theme-subtle theme-border hover:border-[#FF5A14]/60 hover:bg-[#FF5A14]/5'
                      }`}
                      title={`Click to open full cost drilldown & audit for ${cat.name}`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className={`p-2 rounded-xl ${
                            isSelected ? 'bg-[#FF5A14] text-white' : 'bg-[#FF5A14]/15 text-[#FF5A14]'
                          }`}>
                            {getCategoryIcon(cat.icon)}
                          </div>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 theme-muted">
                            {cat.share_pct}% Total
                          </span>
                        </div>

                        <div>
                          <h5 className="text-xs font-bold theme-heading group-hover:text-[#FF7A45] transition-colors line-clamp-1" title={cat.name}>
                            {cat.name}
                          </h5>
                          <span className="text-[10px] theme-muted line-clamp-1 mt-0.5 font-mono">{cat.code}</span>
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t theme-border space-y-2">
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs font-black font-mono theme-heading">{fmtMoney(cat.actual)}</span>
                          <span className="text-[10px] font-mono theme-muted">/ {fmtMoney(cat.planned)}</span>
                        </div>

                        <div className="flex items-center justify-between text-[10px]">
                          <span className={`font-mono font-bold ${isOver ? 'text-red-400' : 'text-emerald-400'}`}>
                            {isOver ? `-${fmtMoney(Math.abs(cat.variance))}` : `+${fmtMoney(cat.variance)}`}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded font-mono font-bold ${
                            isOver ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'
                          }`}>
                            {cat.burn_pct}%
                          </span>
                        </div>

                        <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{ 
                              width: `${Math.min(100, cat.burn_pct)}%`,
                              backgroundColor: isOver ? '#EF4444' : '#10B981'
                            }}
                          ></div>
                        </div>

                        <div className="pt-2 flex items-center justify-between text-[10px] theme-muted border-t border-dashed theme-border">
                          <span className="text-[#FF7A45] font-bold flex items-center gap-0.5 group-hover:underline">
                            Drill Down <ChevronRight size={10} />
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setBudgetCategoryFilter(isSelected ? 'all' : cat.id);
                            }}
                            className="hover:text-[#FF5A14] flex items-center gap-0.5 transition-colors"
                            title="Filter ledger below"
                          >
                            <Filter size={10} />
                            <span>{isSelected ? 'Reset' : 'Filter'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* 5.2 CONTRACTUAL MILESTONE BUDGET TRANCHES (STAGE-GATE DISBURSEMENTS)      */}
          {/* ========================================================================= */}
          {((budget.milestone_breakdown && budget.milestone_breakdown.length > 0) || (timeline.phases && timeline.phases.length > 0)) && (
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider theme-muted flex items-center gap-2">
                  <Calendar size={14} className="text-[#FF5A14]" />
                  <span>Contractual Milestone Capital Tranches & Clearance</span>
                </h4>
                <span className="text-[10px] font-mono text-purple-400 font-bold bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 rounded-full">
                  Stage-Gate Financial Governance
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
                {(budget.milestone_breakdown && budget.milestone_breakdown.length > 0
                  ? budget.milestone_breakdown
                  : (timeline.phases || [])
                ).map((mb, mIdx) => {
                  const mPlanned = mb.planned_tranche || mb.amount || (mb.tranche_amount ? (budget.planned * (mb.tranche_amount / 100)) : 0);
                  const mActual = mb.actual_spent !== undefined ? mb.actual_spent : (mb.completion_pct ? (mPlanned * (mb.completion_pct / 100)) : 0);
                  const mVar = mPlanned - mActual;
                  const isCleared = mb.completion_pct === 100 || (mb.payment_status && mb.payment_status.toLowerCase().includes('cleared'));
                  
                  return (
                    <div 
                      key={mb.id || mIdx} 
                      onClick={() => setSelectedMilestoneModal(mb)}
                      className="p-3.5 rounded-2xl theme-subtle border theme-border flex flex-col justify-between space-y-2 cursor-pointer hover:border-purple-500/60 hover:shadow-lg hover:scale-[1.01] transition-all group"
                      title={`Click to inspect tranche disbursement & governance for ${mb.name}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-[#FF7A45]">[{mb.id}]</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                          isCleared 
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-[#FF5A14]/15 text-[#FF5A14] border border-[#FF5A14]/30'
                        }`}>
                          {mb.payment_status || (isCleared ? 'Tranche Cleared' : 'Incurred')}
                        </span>
                      </div>

                      <h6 className="text-xs font-bold theme-heading line-clamp-1 group-hover:text-purple-400 transition-colors" title={mb.name}>
                        {mb.name}
                      </h6>

                      <div className="pt-2 border-t theme-border grid grid-cols-2 gap-2 text-[11px] font-mono">
                        <div>
                          <span className="text-[9px] uppercase theme-muted block">Tranche Cap</span>
                          <span className="font-bold theme-heading">{fmtMoney(mPlanned)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] uppercase theme-muted block">Incurred Spend</span>
                          <span className="font-bold text-[#FF5A14]">{fmtMoney(mActual)}</span>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between text-[10px] theme-muted border-t border-dashed theme-border">
                        <span>{mb.completion_pct || 0}% Progress</span>
                        <span className="text-purple-400 font-bold flex items-center gap-0.5 group-hover:underline">
                          Inspect Tranche <ChevronRight size={10} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 5.3 ITEMIZED EXPENDITURE LEDGER (FULL DETAILS OF WHERE MONEY WAS SPENT)    */}
          {/* ========================================================================= */}
          <div id="itemized-expenditures" className="space-y-3 pt-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b theme-border">
              <div>
                <div className="flex items-center gap-2">
                  <Receipt size={16} className="text-[#FF5A14]" />
                  <h4 className="text-sm font-extrabold theme-heading">
                    ITEMIZED EXPENDITURE LEDGER & TRANSACTION AUDIT
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FF5A14]/15 text-[#FF5A14] border border-[#FF5A14]/30 font-bold uppercase">
                    Full Financial Detail
                  </span>
                </div>
                <p className="text-xs theme-muted mt-0.5">
                  Reconciled accounting ledger of disbursements, PO lines, contractor invoices, and cost-center allocations
                </p>
              </div>

              <div className="flex items-center gap-2 self-start md:self-auto">
                <button
                  onClick={handleExportExcel}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white text-xs font-bold shadow-md hover:brightness-110 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                  title="Download executive financial audit & milestone reconciliation workbook (.xlsx)"
                >
                  <Download size={13} />
                  <span>Download Financial Audit (Excel)</span>
                </button>
              </div>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="p-3.5 rounded-2xl theme-subtle border theme-border flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={budgetSearchTerm}
                  onChange={(e) => setBudgetSearchTerm(e.target.value)}
                  placeholder="Search by vendor, invoice #, PO, cost center or title..."
                  className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-white dark:bg-black/30 border theme-border text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#FF5A14] transition-all"
                />
                {budgetSearchTerm && (
                  <button 
                    onClick={() => setBudgetSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Status Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-bold whitespace-nowrap">
                <span className="theme-muted text-[10px] uppercase mr-1">Status:</span>
                <button
                  onClick={() => setBudgetStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    budgetStatusFilter === 'all'
                      ? 'bg-[#FF5A14] text-white shadow-sm'
                      : 'theme-subtle theme-muted hover:text-white'
                  }`}
                >
                  All ({budget.ledger?.length || 0})
                </button>
                <button
                  onClick={() => setBudgetStatusFilter('paid')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    budgetStatusFilter === 'paid'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'theme-subtle theme-muted hover:text-white'
                  }`}
                >
                  Settled / Paid
                </button>
                <button
                  onClick={() => setBudgetStatusFilter('flagged')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    budgetStatusFilter === 'flagged'
                      ? 'bg-red-500 text-white shadow-sm'
                      : 'theme-subtle theme-muted hover:text-white'
                  }`}
                >
                  <AlertCircle size={11} />
                  <span>Overrun Flagged ({budget.summary_meta?.flagged_overruns_count || 0})</span>
                </button>
              </div>
            </div>

            {/* Summary Telemetry KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.03] border theme-border flex items-center justify-between">
                <span className="theme-muted text-[10px] uppercase font-sans">Filtered Items:</span>
                <span className="font-bold theme-heading">{filteredLedger.length} of {budget.ledger?.length || 0}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.03] border theme-border flex items-center justify-between">
                <span className="theme-muted text-[10px] uppercase font-sans">Settled Spend:</span>
                <span className="font-bold text-[#FF5A14]">{fmtMoney(filteredLedger.reduce((acc, x) => acc + (x.actual || 0), 0))}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.03] border theme-border flex items-center justify-between">
                <span className="theme-muted text-[10px] uppercase font-sans">Planned Cap:</span>
                <span className="font-bold text-emerald-400">{fmtMoney(filteredLedger.reduce((acc, x) => acc + (x.planned || 0), 0))}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.03] border theme-border flex items-center justify-between">
                <span className="theme-muted text-[10px] uppercase font-sans">Net Variance:</span>
                <span className={`font-bold ${budget.variance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {budget.variance >= 0 ? `+${fmtMoney(budget.variance)}` : `-${fmtMoney(Math.abs(budget.variance))}`}
                </span>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="rounded-2xl border theme-border overflow-hidden bg-slate-50/50 dark:bg-black/20">
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-white/[0.04] text-[10px] font-extrabold uppercase tracking-wider theme-muted border-b theme-border">
                    <tr>
                      <th className="py-3 px-3.5">ID / Invoice #</th>
                      <th className="py-3 px-3.5">Description & Cost Center</th>
                      <th className="py-3 px-3.5">Category</th>
                      <th className="py-3 px-3.5">Vendor / Payee</th>
                      <th className="py-3 px-3.5">Date</th>
                      <th className="py-3 px-3.5 text-right">Planned ($)</th>
                      <th className="py-3 px-3.5 text-right">Actual Spent ($)</th>
                      <th className="py-3 px-3.5 text-right">Variance ($)</th>
                      <th className="py-3 px-3.5 text-center">Status</th>
                      <th className="py-3 px-3.5 text-center">Audit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y theme-border font-sans">
                    {filteredLedger.length === 0 ? (
                      <tr>
                        <td colSpan="10" className="py-8 text-center text-xs theme-muted italic">
                          No expenditure items match your active search or filters.
                        </td>
                      </tr>
                    ) : (
                      filteredLedger.map((exp) => {
                        const isOverrun = exp.variance < 0;
                        return (
                          <tr 
                            key={exp.id}
                            className="hover:bg-slate-100/70 dark:hover:bg-white/[0.03] transition-colors group cursor-pointer"
                            onClick={() => setSelectedExpenseModal(exp)}
                          >
                            <td className="py-3 px-3.5 font-mono">
                              <span className="font-bold text-[#FF7A45] block">{exp.id}</span>
                              <span className="text-[10px] theme-muted">{exp.invoice_no}</span>
                            </td>

                            <td className="py-3 px-3.5 max-w-xs">
                              <span className="font-bold theme-heading block group-hover:text-[#FF7A45] transition-colors line-clamp-1" title={exp.title}>
                                {exp.title}
                              </span>
                              <span className="text-[10px] theme-muted font-mono block mt-0.5">
                                {exp.cost_center} • {exp.gl_code}
                              </span>
                            </td>

                            <td className="py-3 px-3.5 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#FF5A14]/10 text-[#FF7A45] border border-[#FF5A14]/20">
                                {exp.category}
                              </span>
                            </td>

                            <td className="py-3 px-3.5 font-medium theme-heading text-xs whitespace-nowrap">
                              {exp.vendor}
                            </td>

                            <td className="py-3 px-3.5 font-mono text-[11px] theme-muted whitespace-nowrap">
                              {exp.date}
                            </td>

                            <td className="py-3 px-3.5 font-mono text-xs text-right theme-muted whitespace-nowrap">
                              {fmtMoney(exp.planned)}
                            </td>

                            <td className="py-3 px-3.5 font-mono text-xs font-bold text-right text-[#FF5A14] whitespace-nowrap">
                              {fmtMoney(exp.actual)}
                            </td>

                            <td className="py-3 px-3.5 font-mono text-xs font-bold text-right whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-md inline-block ${
                                isOverrun ? 'text-red-400 bg-red-500/10' : 'text-emerald-400 bg-emerald-500/10'
                              }`}>
                                {isOverrun ? `-${fmtMoney(Math.abs(exp.variance))}` : `+${fmtMoney(exp.variance)}`}
                              </span>
                            </td>

                            <td className="py-3 px-3.5 text-center whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                                isOverrun 
                                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              }`}>
                                {exp.status}
                              </span>
                            </td>

                            <td className="py-3 px-3.5 text-center whitespace-nowrap">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedExpenseModal(exp);
                                }}
                                className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-white/10 hover:bg-[#FF5A14] hover:text-white text-[10px] font-bold theme-heading transition-all cursor-pointer"
                                title="Inspect audit notes & procurement justification"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5B. LEVEL 4: PROJECT COMPLETION & DELIVERY VELOCITY (INVESTOR EXCLUSIVE)  */}
      {user?.role === 'Investor' && (currentTab === 'all' || currentTab === 'completion') && (() => {
        const calculationBasis = completion.basis || 'Task Backlog';
        const completionPct = completion.percentage || 0;
        const completionSubtitle = completion.label || 'Project Initialization Phase';
        const totalMonths = completion.timeline?.total_months || 0;
        const elapsedMonths = completion.timeline?.elapsed_months || 0;
        const timelinePct = completion.timeline?.percentage || 0;
        const tasksTotal = completion.tasks?.total || 0;
        const tasksCompleted = completion.tasks?.completed || 0;
        const tasksPct = completion.tasks?.percentage || 0;
        const msTotal = completion.milestones?.total || 0;
        const msCompleted = completion.milestones?.completed || 0;
        const msAvgPct = completion.milestones?.percentage || 0;

        return (
          <div id="completion-breakdown" className="rounded-3xl theme-card border border-[#FF5A14]/25 shadow-lg overflow-hidden" style={{ order: getSectionOrder('completion') }}>
            {/* Header */}
            <div className="p-6 border-b theme-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FF5A14]/5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF5A14] to-[#FF7A45] text-white flex items-center justify-center shadow-[0_0_18px_rgba(255,90,20,0.4)]">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold theme-heading tracking-tight">
                      PROJECT COMPLETION & DELIVERY VELOCITY
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#FF5A14]/15 text-[#FF5A14] border border-[#FF5A14]/30">
                      Level 4 Drilldown
                    </span>
                  </div>
                  <p className="text-xs theme-muted">
                    Overall delivery progress dynamically calibrated across scheduled timeline, sprint task backlog, and contractual SOW milestone tranches.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-3.5 py-1.5 rounded-xl theme-card border theme-border text-right bg-white dark:bg-black/30">
                  <span className="text-[10px] theme-muted block uppercase tracking-wider font-semibold">Primary Basis</span>
                  <span className="text-xs font-extrabold text-[#FF5A14] font-mono">{calculationBasis}</span>
                </div>
                <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-right">
                  <span className="text-[10px] text-emerald-500 block uppercase tracking-wider font-semibold">Delivery State</span>
                  <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                    {completionPct >= 80 ? 'Near Completion' : completionPct >= 50 ? 'In Full Flight' : completionPct > 0 ? 'Active Delivery' : 'Initial Kickoff'}
                  </span>
                </div>
              </div>
            </div>

            {/* Main Progress Bar Strip */}
            <div className="p-6 border-b theme-border bg-slate-50/50 dark:bg-white/[0.01]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black theme-heading font-mono">{completionPct}%</span>
                  <span className="text-xs theme-muted font-medium">Overall Progress Attained</span>
                </div>
                <span className="text-xs font-mono font-bold text-[#FF7A45]">{completionSubtitle}</span>
              </div>
              
              {/* Animated Gradient Bar */}
              <div className="w-full h-3.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden p-0.5 border border-slate-300 dark:border-white/5">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-[#FF5A14] via-[#FF7A45] to-emerald-400 transition-all duration-1000 shadow-[0_0_12px_rgba(255,90,20,0.5)]"
                  style={{ width: `${Math.max(4, completionPct)}%` }}
                ></div>
              </div>
            </div>

            {/* 3 Breakdown Cards: Timeline, Tasks, Milestones */}
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x theme-border p-2 sm:p-4">
              
              {/* 1. Timeline Duration Progress */}
              <div 
                onClick={() => setSearchParams({ tab: 'schedule' })}
                className="p-4 space-y-3 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-white/[0.03] transition-colors group"
                title="Click to drill down into Schedule details"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold theme-heading group-hover:text-blue-500 transition-colors">
                    <span className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg group-hover:bg-blue-500 group-hover:text-white transition-colors">
                      <Clock size={15} />
                    </span>
                    <span>1. Timeline Horizon</span>
                  </div>
                  <span className="text-xs font-mono font-bold theme-heading">
                    {totalMonths > 0 ? `${timelinePct}%` : 'Pending SOW'}
                  </span>
                </div>
                
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${timelinePct > 0 ? Math.max(3, timelinePct) : 0}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between text-[11px] theme-muted">
                  <span>Elapsed Horizon:</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                    {totalMonths > 0 ? `${elapsedMonths} of ${totalMonths} Months` : 'Schedule Pending SOW'}
                  </span>
                </div>
                <p className="text-[10px] theme-muted leading-relaxed">
                  Evaluates calendar time elapsed against planned project lifecycle window (e.g. 8 of 10 months = 80%).
                </p>
              </div>

              {/* 2. Task Backlog Execution */}
              <div 
                onClick={() => setSearchParams({ tab: 'tasks' })}
                className="p-4 space-y-3 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-white/[0.03] transition-colors group"
                title="Click to drill down into Task Backlog"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold theme-heading group-hover:text-[#FF5A14] transition-colors">
                    <span className="p-1.5 bg-[#FF5A14]/10 text-[#FF5A14] rounded-lg group-hover:bg-[#FF5A14] group-hover:text-white transition-colors">
                      <CheckCircle2 size={15} />
                    </span>
                    <span>2. Task Execution</span>
                  </div>
                  <span className="text-xs font-mono font-bold theme-heading">
                    {tasksTotal > 0 ? `${tasksPct}%` : '0% (Pending)'}
                  </span>
                </div>
                
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] transition-all duration-500"
                    style={{ width: `${tasksTotal > 0 ? Math.max(3, tasksPct) : 0}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between text-[11px] theme-muted">
                  <span>Backlog Delivery:</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                    {tasksTotal > 0 ? `${tasksCompleted} of ${tasksTotal} Done` : '0 Tasks Registered'}
                  </span>
                </div>
                <p className="text-[10px] theme-muted leading-relaxed">
                  Direct Jira and sprint task completion ratio (e.g. 10 of 20 tasks completed = 50%).
                </p>
              </div>

              {/* 3. Contractual Milestones */}
              <div 
                onClick={() => setSearchParams({ tab: 'schedule' })}
                className="p-4 space-y-3 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-white/[0.03] transition-colors group"
                title="Click to drill down into Milestone Schedule"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold theme-heading group-hover:text-emerald-500 transition-colors">
                    <span className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                      <Layers size={15} />
                    </span>
                    <span>3. SOW Milestones</span>
                  </div>
                  <span className="text-xs font-mono font-bold theme-heading">
                    {msTotal > 0 ? `${msAvgPct}%` : 'TBD'}
                  </span>
                </div>
                
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${msTotal > 0 ? Math.max(3, msAvgPct) : 0}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between text-[11px] theme-muted">
                  <span>Tranches Verified:</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                    {msTotal > 0 ? `${msCompleted} of ${msTotal} Milestones` : '0 Milestones Logged'}
                  </span>
                </div>
                <p className="text-[10px] theme-muted leading-relaxed">
                  Contractual deliverables verified and signed off for capital tranche disbursement.
                </p>
              </div>

            </div>

            {/* Bottom Methodology Footnote */}
            <div className="px-6 py-3 border-t theme-border bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between text-[11px] theme-muted">
              <span className="flex items-center gap-1.5">
                <Sparkles size={13} className="text-[#FF5A14]" />
                <span>Multi-vector Completion Model: dynamically shifts between task ratio (e.g. 10/20 = 50%), schedule elapsed (e.g. 8/10 mos = 80%), and SOW deliverables.</span>
              </span>
              <span className="font-mono text-[10px] text-slate-400 hidden sm:inline">VPM Autonomous Calculation</span>
            </div>

          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* 6. LEVEL 4: ESTIMATED DEADLINE & SCHEDULE — MILESTONE STAGE-GATES */}
      {/* ========================================================================= */}
      {(currentTab === 'all' || currentTab === 'schedule') && (
        <div id="schedule-breakdown" className="p-6 rounded-3xl theme-card border border-[#FF5A14]/25 shadow-lg space-y-5" style={{ order: getSectionOrder('schedule') }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b theme-border">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-400">
                <Calendar size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold theme-heading">ESTIMATED DEADLINE & SCHEDULE</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 font-bold uppercase">
                    Level 4 Drilldown
                  </span>
                </div>
                <p className="text-xs theme-muted">Target go-live dates, milestone stage-gates & schedule performance index (SPI)</p>
              </div>
            </div>

            <span className="text-xs font-mono font-bold text-purple-400">
              Go-Live Target: {timeline.target_completion_date}
            </span>
          </div>

          {/* 4 Schedule Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl theme-subtle border theme-border text-center">
              <span className="theme-muted block text-[10px] uppercase font-bold tracking-wider">Target Completion</span>
              <span className="text-sm sm:text-base font-black theme-heading font-mono mt-1 block truncate" title={timeline.target_completion_date}>
                {timeline.target_completion_date}
              </span>
              <span className="text-[10px] theme-muted mt-0.5 block">Charter Governed</span>
            </div>

            <div className="p-4 rounded-2xl theme-subtle border theme-border text-center">
              <span className="theme-muted block text-[10px] uppercase font-bold tracking-wider">Days Remaining</span>
              <span className="text-xl sm:text-2xl font-black text-purple-400 font-mono mt-1 block">
                {timeline.days_remaining}d
              </span>
              <span className="text-[10px] text-purple-300 mt-0.5 block">Working Days</span>
            </div>

            <div className="p-4 rounded-2xl theme-subtle border theme-border text-center">
              <span className="theme-muted block text-[10px] uppercase font-bold tracking-wider">Schedule SPI</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-1 block">
                {timeline.spi}
              </span>
              <span className="text-[10px] text-emerald-500 mt-0.5 block">On Schedule</span>
            </div>

            <div className="p-4 rounded-2xl theme-subtle border theme-border text-center">
              <span className="theme-muted block text-[10px] uppercase font-bold tracking-wider">Schedule Trajectory</span>
              <span className="text-xs sm:text-sm font-bold text-emerald-400 mt-1 block truncate">
                {timeline.schedule_status}
              </span>
              <span className="text-[10px] theme-muted mt-0.5 block">SOW Baseline Valid</span>
            </div>
          </div>

          {/* Delivery Milestone Sequence */}
          <div className="space-y-3 pt-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider theme-muted flex items-center gap-2">
                <Layers size={14} className="text-[#FF5A14]" />
                <span>Project Delivery Roadmaps & Milestone Phases</span>
              </h4>
              <div className="flex items-center gap-3 text-[10px] font-mono font-bold bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-lg border theme-border">
                <span className="text-slate-400 font-sans uppercase text-[9px] mr-1">Logic:</span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> 100% (Done)</span>
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> 50% (Track)</span>
                <span className="flex items-center gap-1 text-red-600 dark:text-red-400"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> 20% (Risk)</span>
                <span className="flex items-center gap-1 text-slate-500"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> 0% (Pending)</span>
              </div>
            </div>

            <div className="space-y-2.5">
              {(!timeline.phases || timeline.phases.length === 0) ? (
                <div className="p-8 text-center rounded-2xl theme-subtle border theme-border flex flex-col items-center justify-center space-y-2">
                  <Clock size={32} className="text-[#FF5A14] opacity-50 mb-1" />
                  <h5 className="text-sm font-bold theme-heading">No Milestones Ingested Yet</h5>
                  <p className="text-xs theme-muted max-w-md leading-relaxed">
                    Upload a Project SOW or Project Charter document to dynamically extract contractual milestones, delivery dates, and stage-gate deliverables.
                  </p>
                </div>
              ) : (
                timeline.phases.map((ph, idx) => (
                <div 
                  key={ph.id || idx}
                  onClick={() => setExpandedPhase(expandedPhase === idx ? null : idx)}
                  className={`p-4 rounded-2xl theme-subtle border flex flex-col justify-between gap-3 group transition-all duration-300 cursor-pointer ${
                    expandedPhase === idx ? 'border-[#FF5A14] shadow-[0_0_20px_rgba(255,90,20,0.1)]' : 'theme-border hover:border-[#FF5A14]/50 hover:bg-[#FF5A14]/5'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 w-full">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono text-xs font-black flex-shrink-0 ${
                        ph.status === 'Completed' || ph.status.toLowerCase() === 'done'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : ph.status === 'In Progress' || ph.status.toLowerCase() === 'on track'
                          ? 'bg-[#FF5A14]/15 text-[#FF5A14] border border-[#FF5A14]/30'
                          : 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
                      }`}>
                        {(ph.status === 'Completed' || ph.status.toLowerCase() === 'done') ? <Check size={16} /> : idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#FF7A45]">[{ph.id}]</span>
                          <h5 className="text-sm font-bold theme-heading group-hover:text-[#FF7A45] transition-colors">{ph.name}</h5>
                        </div>
                        <span className="text-xs theme-muted">Target Deadline: <strong className="theme-heading">{ph.target_date}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end md:self-auto">
                      <div className="w-28 sm:w-36 text-right">
                        <div className="flex justify-between text-[11px] font-mono mb-1">
                          <span className="theme-muted">{ph.days_left > 0 ? `${ph.days_left}d left` : 'Cleared'}</span>
                          <span className="font-bold theme-heading">{ph.completion_pct}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500" 
                            style={{ 
                              width: `${ph.completion_pct}%`,
                              backgroundColor: (ph.status === 'Completed' || ph.status.toLowerCase() === 'done') ? '#10B981' : ((ph.status === 'In Progress' || ph.status.toLowerCase() === 'on track') ? '#FF5A14' : '#64748B')
                            }}
                          ></div>
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        (ph.status === 'Completed' || ph.status.toLowerCase() === 'done') ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                        (ph.status === 'In Progress' || ph.status.toLowerCase() === 'on track') ? 'bg-[#FF5A14]/15 text-[#FF5A14] border border-[#FF5A14]/30' :
                        'bg-slate-500/15 text-slate-400 border border-slate-500/30'
                      }`}>
                        {ph.status}
                      </span>
                      
                      <ChevronRight size={18} className={`text-slate-400 transition-transform duration-300 ${expandedPhase === idx ? 'rotate-90 text-[#FF5A14]' : 'group-hover:text-white'}`} />
                    </div>
                  </div>
                  
                  {expandedPhase === idx && (
                    <div className="w-full pt-4 mt-2 border-t theme-border animate-fadeIn flex flex-col md:flex-row gap-6" onClick={(e) => e.stopPropagation()}>
                      <div className="flex-1 space-y-3">
                        <h6 className="text-[11px] uppercase tracking-wider font-extrabold text-slate-500">Milestone Details</h6>
                        <p className="text-sm theme-muted leading-relaxed">
                          Phase {ph.id} represents a key delivery gateway for this project. 
                          The primary objectives revolve around completing {ph.name.toLowerCase().replace(ph.id.toLowerCase()+':', '').replace(ph.id.toLowerCase(), '').trim()} ensuring full alignment with the enterprise guardrails and SLA matrices.
                        </p>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div className="p-3 rounded-xl bg-white/[0.02] border theme-border">
                            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Assigned Workstream</span>
                            <span className="text-xs font-semibold theme-heading flex items-center gap-1.5"><Briefcase size={12} className="text-[#FF5A14]"/> Enterprise IT Delivery</span>
                          </div>
                          <div className="p-3 rounded-xl bg-white/[0.02] border theme-border">
                            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Approval Gate</span>
                            <span className="text-xs font-semibold theme-heading flex items-center gap-1.5"><ShieldCheck size={12} className="text-[#10B981]"/> Required</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 space-y-3">
                         <h6 className="text-[11px] uppercase tracking-wider font-extrabold text-slate-500">Key Deliverables</h6>
                         <ul className="space-y-2">
                           {[
                             `Finalize architecture & scoping for ${ph.id}`,
                             `Complete integration & testing phases`,
                             `Secure stakeholder sign-off & compliance audit`
                           ].map((item, dIdx) => (
                             <li key={dIdx} className="flex items-start gap-2 text-xs theme-muted">
                               <CheckCircle2 size={14} className={ph.completion_pct === 100 ? 'text-[#10B981]' : 'text-slate-500'} />
                               <span className={ph.completion_pct === 100 ? 'line-through opacity-70' : ''}>{item}</span>
                             </li>
                           ))}
                         </ul>
                      </div>
                    </div>
                  )}
                </div>
              )))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TASK EXECUTION DRILLDOWN */}
      {/* ========================================================================= */}
      {(currentTab === 'all' || currentTab === 'tasks') && (
        <div id="tasks-breakdown" className="p-6 rounded-3xl theme-card border border-[#FF5A14]/25 shadow-lg space-y-5" style={{ order: getSectionOrder('tasks') || 5.5 }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b theme-border">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#FF5A14] to-[#FF7A45] text-white shadow-md">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold theme-heading">TASK EXECUTION BACKLOG</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FF5A14]/15 text-[#FF5A14] border border-[#FF5A14]/30 font-bold uppercase">
                    Level 4 Drilldown
                  </span>
                </div>
                <p className="text-xs theme-muted">Detailed view of all tasks, deliverables, and Jira issues tracked against this project.</p>
              </div>
            </div>
          </div>

          {(() => {
            const tasks = data.tasks || [];
            const completedTasks = tasks.filter(t => t.status === 'Completed' || t.status === 'Done' || t.status === 'Resolved');
            const pendingTasks = tasks.filter(t => t.status !== 'Completed' && t.status !== 'Done' && t.status !== 'Resolved');
            
            return (
              <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 shrink-0">
                  <div className="p-4 rounded-2xl theme-subtle border theme-border">
                    <span className="theme-muted text-[10px] uppercase font-bold tracking-wider">Active / Pending Tasks</span>
                    <div className="text-2xl font-black theme-heading font-mono mt-1">{pendingTasks.length}</div>
                  </div>
                  <div className="p-4 rounded-2xl theme-subtle border theme-border">
                    <span className="theme-muted text-[10px] uppercase font-bold tracking-wider">Completed</span>
                    <div className="text-2xl font-black text-emerald-500 font-mono mt-1">{completedTasks.length}</div>
                  </div>
                </div>

                {/* Split View */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column: Pending / Active */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-2 border-b theme-border pb-2">
                      <Clock size={14} />
                      <span>Active & Pending Work</span>
                    </h4>
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
                      {pendingTasks.length === 0 ? (
                        <div className="p-4 text-center text-xs theme-muted rounded-xl border border-dashed theme-border">
                          No pending tasks.
                        </div>
                      ) : (
                        pendingTasks.map((task, idx) => (
                          <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border theme-border flex items-start gap-3 group hover:border-amber-500/30 transition-colors">
                            <div className="p-1.5 rounded-lg mt-0.5 bg-amber-500/10 text-amber-500 shrink-0">
                              <div className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin opacity-50" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h5 className="text-sm font-bold theme-heading group-hover:text-amber-500 transition-colors truncate" title={task.summary || task.title}>{task.summary || task.title}</h5>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500 whitespace-nowrap shrink-0 mt-0.5">
                                  {task.status}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-1.5 text-[10px] theme-muted">
                                {task.jira_key && <span className="font-mono text-blue-500">{task.jira_key}</span>}
                                <span className="flex items-center gap-1"><Users size={10} /> {task.assignee || 'Unassigned'}</span>
                                <span className="flex items-center gap-1"><Tag size={10} /> {task.priority || 'Medium'}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Right Column: Completed */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-2 border-b theme-border pb-2">
                      <CheckCircle2 size={14} />
                      <span>Completed Deliverables</span>
                    </h4>
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
                      {completedTasks.length === 0 ? (
                        <div className="p-4 text-center text-xs theme-muted rounded-xl border border-dashed theme-border">
                          No completed tasks yet.
                        </div>
                      ) : (
                        completedTasks.map((task, idx) => (
                          <div key={idx} className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/[0.02] border border-emerald-100 dark:border-emerald-500/10 flex items-start gap-3 group hover:border-emerald-500/30 transition-colors opacity-75 hover:opacity-100">
                            <div className="p-1.5 rounded-lg mt-0.5 bg-emerald-500/10 text-emerald-500 shrink-0">
                              <Check size={14} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h5 className="text-sm font-bold theme-heading group-hover:text-emerald-500 transition-colors truncate line-through" title={task.summary || task.title}>{task.summary || task.title}</h5>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 whitespace-nowrap shrink-0 mt-0.5">
                                  {task.status}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-1.5 text-[10px] theme-muted">
                                {task.jira_key && <span className="font-mono text-emerald-500/70">{task.jira_key}</span>}
                                <span className="flex items-center gap-1"><Users size={10} /> {task.assignee || 'Unassigned'}</span>
                                <span className="flex items-center gap-1"><Tag size={10} /> {task.priority || 'Medium'}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. LEVEL 4: VENDOR SLA & GOVERNANCE COMPLIANCE */}
      {/* ========================================================================= */}
      {(currentTab === 'all' || currentTab === 'governance') && (
        <div id="governance-breakdown" className="p-6 rounded-3xl theme-card border border-[#FF5A14]/25 shadow-lg space-y-5" style={{ order: getSectionOrder('governance') }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b theme-border">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400">
                <ShieldCheck size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold theme-heading">VENDOR SLA & GOVERNANCE</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 font-bold uppercase">
                    Level 4 Drilldown
                  </span>
                </div>
                <p className="text-xs theme-muted">Autonomous gate clearances, compliance audit scores & supplier SLA adherence</p>
              </div>
            </div>

            <Link
              to="/guardrails"
              className="text-xs font-bold text-[#FF5A14] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Manage in Guardrails</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          {/* 4 Governance Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl theme-subtle border theme-border text-center">
              <span className="theme-muted block text-[10px] uppercase font-bold tracking-wider">SLA Adherence</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-1 block">
                {governance.vendor_sla_adherence}%
              </span>
              <span className="text-[10px] text-emerald-500 mt-0.5 block">Zero SLA Breaches</span>
            </div>

            <div className="p-4 rounded-2xl theme-subtle border theme-border text-center">
              <span className="theme-muted block text-[10px] uppercase font-bold tracking-wider">Audit Score</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-1 block">
                {governance.compliance_audit_score}%
              </span>
              <span className="text-[10px] text-emerald-500 mt-0.5 block">100% Policy Pass</span>
            </div>

            <div className="p-4 rounded-2xl theme-subtle border theme-border text-center">
              <span className="theme-muted block text-[10px] uppercase font-bold tracking-wider">Open Escalations</span>
              <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono mt-1 block">
                {governance.open_escalations}
              </span>
              <span className="text-[10px] text-amber-500 mt-0.5 block">Requires Review</span>
            </div>

            <div className="p-4 rounded-2xl theme-subtle border theme-border text-center">
              <span className="theme-muted block text-[10px] uppercase font-bold tracking-wider">Compliance Gate</span>
              <span className="text-xs sm:text-sm font-bold text-emerald-400 mt-1 block truncate">
                {governance.gate_clearance_status}
              </span>
              <span className="text-[10px] text-emerald-500 mt-0.5 block">Autonomous Cleared</span>
            </div>
          </div>

          {/* Vendor Partner Pods */}
          <div className="space-y-3 pt-1">
            <h4 className="text-xs font-bold uppercase tracking-wider theme-muted flex items-center gap-2">
              <Building2 size={14} className="text-[#FF5A14]" />
              <span>Contracted Vendor Partner Pods & SLA Metrics</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(teamData?.vendors && teamData.vendors.length > 0) ? (
                teamData.vendors.map((v, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl theme-subtle border theme-border flex items-center justify-between">
                    <div>
                      <h6 className="text-xs font-bold theme-heading">{v.name}</h6>
                      <span className="text-[11px] theme-muted">{v.type} • Contract Share: {v.share || '100%'}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black font-mono text-[#FF5A14]">{v.headcount || v.count || 1} Staff</span>
                      <span className="block text-[10px] font-mono text-emerald-400 font-bold">SLA: {v.sla || '100%'}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 p-4 rounded-xl theme-subtle border theme-border text-center text-xs theme-muted">
                  No separate vendor contracts configured. Project delivery managed by internal enterprise team.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. BURNDOWN CHART & RISK HEATMAP (Heatmap hidden on Budget tab & Investor) */}
      {/* ========================================================================= */}
      {(currentTab === 'all' || currentTab === 'budget' || (currentTab === 'threats' && user?.role !== 'Investor')) && (
        <div className={`grid grid-cols-1 ${currentTab === 'budget' || user?.role === 'Investor' || currentTab === 'threats' ? 'lg:grid-cols-1' : 'lg:grid-cols-2'} gap-6`} style={{ order: getSectionOrder('charts') }}>
          {(currentTab === 'all' || currentTab === 'budget') && (
            <div>
              <BurndownChart data={data.burndown} />
            </div>
          )}
          {(currentTab === 'all' || currentTab === 'threats') && user?.role !== 'Investor' && (
            <div>
              <RiskHeatmap data={data.risks} />
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. PROGRAM ISSUES & THREAT REGISTER (COMMENTED OUT FOR INVESTOR PERSONA) */}
      {/* ========================================================================= */}
      {user?.role !== 'Investor' && (currentTab === 'all' || currentTab === 'threats') && (
        <div id="threat-register" style={{ order: getSectionOrder('threats') }}>
          <ProjectThreatRegister
            risks={data.risk_details || data.recent_risks || []}
            activeProject={{ id: projectNumericId, jira_key: projectKey, name: data.name }}
            totalCount={data.total_project_risks !== undefined ? data.total_project_risks : (data.risk_details?.length || 0)}
            maxDisplay={5}
          />
        </div>
      )}
      {/* 
        Threat Register commented out for Investor Persona:
        Investors do not have access to risk details.
      */}

      {/* ========================================================================= */}
      {/* 10. ITEMIZED EXPENSE DETAIL & AUDIT MODAL                                 */}
      {/* ========================================================================= */}
      {selectedExpenseModal && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedExpenseModal(null)}
        >
          <div 
            className="w-full max-w-2xl p-6 rounded-3xl theme-card border border-[#FF5A14]/30 shadow-2xl space-y-5 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-4 border-b theme-border">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-[#FF5A14]/15 text-[#FF5A14]">
                  <Receipt size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-[#FF7A45]">[{selectedExpenseModal.id}]</span>
                    <span className="text-xs font-mono font-semibold theme-muted">{selectedExpenseModal.invoice_no}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                      selectedExpenseModal.variance < 0
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {selectedExpenseModal.status}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold theme-heading mt-0.5">
                    {selectedExpenseModal.title}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setSelectedExpenseModal(null)}
                className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
                title="Close Modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* 4 Financial Reconciliation KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-2xl theme-subtle border theme-border text-center">
                <span className="text-[10px] uppercase font-bold theme-muted block">Planned Baseline</span>
                <span className="text-base font-black font-mono theme-heading mt-1 block">
                  {fmtMoney(selectedExpenseModal.planned)}
                </span>
                <span className="text-[9px] theme-muted mt-0.5 block">Approved Cap</span>
              </div>

              <div className="p-3 rounded-2xl theme-subtle border theme-border text-center">
                <span className="text-[10px] uppercase font-bold theme-muted block">Actual Incurred</span>
                <span className="text-base font-black font-mono text-[#FF5A14] mt-1 block">
                  {fmtMoney(selectedExpenseModal.actual)}
                </span>
                <span className="text-[9px] font-mono text-[#FF7A45] mt-0.5 block">
                  {selectedExpenseModal.planned > 0 ? `${Math.round((selectedExpenseModal.actual / selectedExpenseModal.planned) * 100)}% Consumed` : 'Direct Spend'}
                </span>
              </div>

              <div className="p-3 rounded-2xl theme-subtle border theme-border text-center">
                <span className="text-[10px] uppercase font-bold theme-muted block">Cost Variance</span>
                <span className={`text-base font-black font-mono mt-1 block ${
                  selectedExpenseModal.variance >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {selectedExpenseModal.variance >= 0 ? `+${fmtMoney(selectedExpenseModal.variance)}` : `-${fmtMoney(Math.abs(selectedExpenseModal.variance))}`}
                </span>
                <span className="text-[9px] font-bold mt-0.5 block" style={{ color: selectedExpenseModal.variance >= 0 ? '#10B981' : '#EF4444' }}>
                  {selectedExpenseModal.variance >= 0 ? 'Within Budget' : 'Cost Overrun'}
                </span>
              </div>

              <div className="p-3 rounded-2xl theme-subtle border theme-border text-center">
                <span className="text-[10px] uppercase font-bold theme-muted block">PO Reference</span>
                <span className="text-xs font-black font-mono theme-heading mt-1 block truncate" title={selectedExpenseModal.po_number}>
                  {selectedExpenseModal.po_number || 'PO-DIRECT'}
                </span>
                <span className="text-[9px] theme-muted mt-0.5 block">Enterprise ERP</span>
              </div>
            </div>

            {/* Accounting & Governance Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl theme-subtle border theme-border space-y-1">
                <span className="text-[10px] uppercase font-bold theme-muted block">Cost Center & General Ledger</span>
                <div className="font-mono font-bold theme-heading text-[11px]">
                  {selectedExpenseModal.cost_center}
                </div>
                <div className="font-mono text-[10px] text-purple-400">
                  {selectedExpenseModal.gl_code}
                </div>
              </div>

              <div className="p-3 rounded-2xl theme-subtle border theme-border space-y-1">
                <span className="text-[10px] uppercase font-bold theme-muted block">Payee / Contracted Vendor</span>
                <div className="font-bold theme-heading flex items-center gap-1.5">
                  <Building2 size={13} className="text-[#FF5A14]" />
                  <span>{selectedExpenseModal.vendor}</span>
                </div>
                <div className="text-[10px] theme-muted">
                  Domain: {selectedExpenseModal.category}
                </div>
              </div>

              <div className="p-3 rounded-2xl theme-subtle border theme-border space-y-1">
                <span className="text-[10px] uppercase font-bold theme-muted block">Invoice Date & Settlement</span>
                <div className="font-mono font-bold theme-heading text-[11px] flex items-center gap-1.5">
                  <Calendar size={13} className="text-[#FF5A14]" />
                  <span>Invoiced: {selectedExpenseModal.date}</span>
                </div>
                <div className="text-[10px] text-emerald-400 font-mono">
                  Settled: {selectedExpenseModal.payment_date || 'Paid'}
                </div>
              </div>

              <div className="p-3 rounded-2xl theme-subtle border theme-border space-y-1">
                <span className="text-[10px] uppercase font-bold theme-muted block">Approving Governance Officer</span>
                <div className="font-bold theme-heading flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-emerald-400" />
                  <span>{selectedExpenseModal.approver || 'PMO Lead'}</span>
                </div>
                <div className="text-[10px] theme-muted font-mono">
                  Authorization Gate: Cleared
                </div>
              </div>
            </div>

            {/* PMO Audit & Variance Justification Notes */}
            <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-black/40 border theme-border space-y-1.5">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#FF7A45]">
                <Info size={13} />
                <span>PMO Expenditure & Cost Variance Analysis</span>
              </div>
              <p className="text-xs theme-muted leading-relaxed">
                {selectedExpenseModal.notes || 'Expenditure validated against statement of work deliverable milestones and verified contractor timesheets.'}
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t theme-border">
              <button
                onClick={() => setSelectedExpenseModal(null)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white text-xs font-bold shadow-md hover:brightness-110 transition-all cursor-pointer"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. COST DOMAIN DEEP DIVE DRILLDOWN MODAL */}
      {selectedDomainModal && (() => {
        const cat = selectedDomainModal;
        const isOver = cat.variance < 0;
        const catLedger = (budget.ledger || []).filter(item => 
          (item.category_id && item.category_id === cat.id) || 
          (item.category && item.category.toLowerCase() === cat.name.toLowerCase()) ||
          (item.category && item.category.toLowerCase().includes(cat.name.split('.')[0].toLowerCase()))
        );

        return (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn"
            onClick={() => setSelectedDomainModal(null)}
          >
            <div 
              className="w-full max-w-4xl p-6 rounded-3xl theme-card border border-[#FF5A14]/40 shadow-2xl space-y-5 animate-scaleUp max-h-[90vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-3 pb-4 border-b theme-border shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-[#FF5A14]/15 text-[#FF5A14]">
                    {getCategoryIcon(cat.icon)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-[#FF7A45]">[{cat.code}]</span>
                      <span className="text-xs font-mono font-semibold theme-muted">{cat.share_pct}% of Contract</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                        isOver
                          ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {cat.status || (isOver ? 'Over Budget' : 'Within Budget')}
                      </span>
                    </div>
                    <h3 className="text-lg font-extrabold theme-heading mt-0.5">
                      {cat.name}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedDomainModal(null)}
                  className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
                  title="Close Modal"
                >
                  <X size={20} />
                </button>
              </div>

              {/* 4 Financial KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
                <div className="p-3.5 rounded-2xl theme-subtle border theme-border text-center">
                  <span className="text-[10px] uppercase font-bold theme-muted block">Contract Cap</span>
                  <span className="text-base font-black font-mono theme-heading mt-1 block">
                    {fmtMoney(cat.planned)}
                  </span>
                  <span className="text-[9px] theme-muted mt-0.5 block">Approved Allocation</span>
                </div>

                <div className="p-3.5 rounded-2xl theme-subtle border theme-border text-center">
                  <span className="text-[10px] uppercase font-bold theme-muted block">Actual Incurred</span>
                  <span className="text-base font-black font-mono text-[#FF5A14] mt-1 block">
                    {fmtMoney(cat.actual)}
                  </span>
                  <span className="text-[9px] font-mono text-[#FF7A45] mt-0.5 block">
                    {cat.burn_pct}% Burn Rate
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl theme-subtle border theme-border text-center">
                  <span className="text-[10px] uppercase font-bold theme-muted block">Domain Variance</span>
                  <span className={`text-base font-black font-mono mt-1 block ${
                    !isOver ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {!isOver ? `+${fmtMoney(cat.variance)}` : `-${fmtMoney(Math.abs(cat.variance))}`}
                  </span>
                  <span className="text-[9px] font-bold mt-0.5 block" style={{ color: !isOver ? '#10B981' : '#EF4444' }}>
                    {!isOver ? 'Favorable Runway' : 'Budget Overrun'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl theme-subtle border theme-border text-center">
                  <span className="text-[10px] uppercase font-bold theme-muted block">Itemized Records</span>
                  <span className="text-base font-black font-mono theme-heading mt-1 block">
                    {catLedger.length}
                  </span>
                  <span className="text-[9px] theme-muted mt-0.5 block">Active Ledger Lines</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5 shrink-0">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="theme-muted">Capital Expenditure Burn: {cat.burn_pct}%</span>
                  <span className={isOver ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {fmtMoney(cat.actual)} / {fmtMoney(cat.planned)}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min(100, cat.burn_pct)}%`,
                      backgroundColor: isOver ? '#EF4444' : '#10B981'
                    }}
                  ></div>
                </div>
              </div>

              {/* Itemized Ledger Table */}
              <div className="flex-1 overflow-y-auto space-y-2 border theme-border rounded-2xl p-3 bg-slate-50/50 dark:bg-black/20">
                <div className="flex items-center justify-between pb-2 border-b theme-border">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#FF7A45] flex items-center gap-1.5">
                    <Receipt size={14} />
                    <span>Itemized Expenditures for {cat.name}</span>
                  </span>
                  <span className="text-[10px] font-mono theme-muted">
                    {catLedger.length} items logged
                  </span>
                </div>

                {catLedger.length === 0 ? (
                  <div className="py-8 text-center text-xs theme-muted italic">
                    No individual ledger lines mapped to this domain yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {catLedger.map((item, iIdx) => (
                      <div 
                        key={item.id || iIdx}
                        onClick={() => setSelectedExpenseModal(item)}
                        className="p-3 rounded-xl theme-subtle border theme-border hover:border-[#FF5A14]/50 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group transition-all"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-bold text-[#FF7A45]">[{item.id}]</span>
                            <span className="font-mono text-[10px] theme-muted">{item.po_number || item.invoice_no}</span>
                            <span className="text-[9px] font-mono px-2 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 font-bold">
                              {item.status}
                            </span>
                          </div>
                          <div className="text-xs font-bold theme-heading group-hover:text-[#FF7A45] transition-colors">
                            {item.title}
                          </div>
                          {item.notes && (
                            <div className="text-[10px] theme-muted line-clamp-1">
                              {item.notes}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center sm:flex-col sm:items-end justify-between gap-1 shrink-0 font-mono">
                          <span className="text-xs font-black text-[#FF5A14]">{fmtMoney(item.actual)}</span>
                          <span className="text-[10px] theme-muted">Cap: {fmtMoney(item.planned)}</span>
                          <span className="text-[9px] text-purple-400 group-hover:underline flex items-center gap-0.5">
                            Audit Details <ChevronRight size={10} />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t theme-border shrink-0">
                <button
                  onClick={() => {
                    setBudgetCategoryFilter(cat.id);
                    setSelectedDomainModal(null);
                    const el = document.getElementById('itemized-expenditures');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-[#FF5A14]/20 text-xs font-bold theme-heading transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Filter size={13} className="text-[#FF5A14]" />
                  <span>Filter Main Ledger to this Domain</span>
                </button>

                <button
                  onClick={() => setSelectedDomainModal(null)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white text-xs font-bold shadow-md hover:brightness-110 transition-all cursor-pointer"
                >
                  Close Domain View
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 12. CONTRACTUAL MILESTONE CAPITAL TRANCHE DRILLDOWN MODAL */}
      {selectedMilestoneModal && (() => {
        const mb = selectedMilestoneModal;
        const mPlanned = mb.planned_tranche || mb.amount || (mb.tranche_amount ? (budget.planned * (mb.tranche_amount / 100)) : 0);
        const mActual = mb.actual_spent !== undefined ? mb.actual_spent : (mb.completion_pct ? (mPlanned * (mb.completion_pct / 100)) : 0);
        const mVar = mPlanned - mActual;
        const isCleared = mb.completion_pct === 100 || (mb.payment_status && mb.payment_status.toLowerCase().includes('cleared'));

        const linkedTasks = (data.tasks || []).filter(t => 
          (t.milestone_id && t.milestone_id === mb.id) ||
          (t.jira_key && t.jira_key.toLowerCase().includes(String(mb.id).toLowerCase())) ||
          (t.summary && mb.name && t.summary.toLowerCase().includes(mb.name.toLowerCase().slice(0, 15)))
        );

        return (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn"
            onClick={() => setSelectedMilestoneModal(null)}
          >
            <div 
              className="w-full max-w-3xl p-6 rounded-3xl theme-card border border-purple-500/40 shadow-2xl space-y-5 animate-scaleUp max-h-[90vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-3 pb-4 border-b theme-border shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-purple-500/15 text-purple-400">
                    <Calendar size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-purple-400">[{mb.id}]</span>
                      <span className="text-xs font-mono font-semibold theme-muted">{mb.percentage || 0}% of SOW</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                        isCleared
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-[#FF5A14]/15 text-[#FF5A14] border border-[#FF5A14]/30'
                      }`}>
                        {mb.payment_status || (isCleared ? 'Tranche Cleared' : 'Incurred')}
                      </span>
                    </div>
                    <h3 className="text-lg font-extrabold theme-heading mt-0.5">
                      {mb.name}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedMilestoneModal(null)}
                  className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
                  title="Close Modal"
                >
                  <X size={20} />
                </button>
              </div>

              {/* 4 Financial & Governance KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
                <div className="p-3.5 rounded-2xl theme-subtle border theme-border text-center">
                  <span className="text-[10px] uppercase font-bold theme-muted block">Tranche Cap</span>
                  <span className="text-base font-black font-mono theme-heading mt-1 block">
                    {fmtMoney(mPlanned)}
                  </span>
                  <span className="text-[9px] theme-muted mt-0.5 block">Contractual Budget</span>
                </div>

                <div className="p-3.5 rounded-2xl theme-subtle border theme-border text-center">
                  <span className="text-[10px] uppercase font-bold theme-muted block">Disbursed / Incurred</span>
                  <span className="text-base font-black font-mono text-[#FF5A14] mt-1 block">
                    {fmtMoney(mActual)}
                  </span>
                  <span className="text-[9px] font-mono text-purple-400 mt-0.5 block">
                    {mb.completion_pct || 0}% Cleared
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl theme-subtle border theme-border text-center">
                  <span className="text-[10px] uppercase font-bold theme-muted block">Tranche Reserve</span>
                  <span className="text-base font-black font-mono text-emerald-400 mt-1 block">
                    {fmtMoney(Math.max(0, mVar))}
                  </span>
                  <span className="text-[9px] text-emerald-400 font-bold mt-0.5 block">
                    {mVar > 0 ? 'Retained Buffer' : 'Full Disbursed'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl theme-subtle border theme-border text-center">
                  <span className="text-[10px] uppercase font-bold theme-muted block">SLA Adherence</span>
                  <span className="text-base font-black font-mono text-purple-400 mt-1 block">
                    {mb.sla_score ? `${mb.sla_score}%` : '96.5%'}
                  </span>
                  <span className="text-[9px] text-emerald-400 font-bold mt-0.5 block">
                    {mb.sla_status || 'Compliant'}
                  </span>
                </div>
              </div>

              {/* Governance & Stage-Gate Clearance Verification */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs shrink-0">
                <div className="p-3 rounded-2xl theme-subtle border theme-border space-y-1">
                  <span className="text-[10px] uppercase font-bold theme-muted block">Contractual Target Date</span>
                  <div className="font-mono font-bold theme-heading text-[11px] flex items-center gap-1.5">
                    <Clock size={13} className="text-purple-400" />
                    <span>{mb.target_date || 'Contract Governed'}</span>
                  </div>
                  <div className="text-[10px] text-emerald-400 font-mono">
                    Stage-Gate Review: Authorized
                  </div>
                </div>

                <div className="p-3 rounded-2xl theme-subtle border theme-border space-y-1">
                  <span className="text-[10px] uppercase font-bold theme-muted block">Disbursement Governance Gate</span>
                  <div className="font-bold theme-heading flex items-center gap-1.5">
                    <ShieldCheck size={13} className={isCleared ? "text-emerald-400" : "text-[#FF5A14]"} />
                    <span>{isCleared ? "Gate Passed — Capital Released" : "In Progress — Milestone Acceptance"}</span>
                  </div>
                  <div className="text-[10px] theme-muted font-mono">
                    SteerCo Approved Baseline
                  </div>
                </div>
              </div>

              {/* Linked Workstream Tasks & Deliverables */}
              <div className="flex-1 overflow-y-auto space-y-2 border theme-border rounded-2xl p-3 bg-slate-50/50 dark:bg-black/20">
                <div className="flex items-center justify-between pb-2 border-b theme-border">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                    <Layers size={14} />
                    <span>Linked Workstreams & Deliverable Verifications</span>
                  </span>
                  <span className="text-[10px] font-mono theme-muted">
                    {linkedTasks.length > 0 ? `${linkedTasks.length} tasks mapped` : 'Phase Governed'}
                  </span>
                </div>

                {linkedTasks.length === 0 ? (
                  <div className="p-4 rounded-xl theme-subtle border theme-border text-xs space-y-2">
                    <div className="font-bold theme-heading flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-400" />
                      <span>Contract Deliverables: {mb.name}</span>
                    </div>
                    <p className="text-[11px] theme-muted leading-relaxed">
                      This milestone governs tranche clearance against contract milestone {mb.id}. All technical and operational deliverables under this tranche are subject to formal steering committee sign-off and SLA verification.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {linkedTasks.map((task, tIdx) => (
                      <div 
                        key={task.id || tIdx}
                        className="p-3 rounded-xl theme-subtle border theme-border flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold text-purple-400">[{task.jira_key || `TSK-${tIdx+1}`}]</span>
                            <span className={`px-2 py-0.2 rounded-full text-[9px] font-mono font-bold ${
                              task.status === 'Completed' || task.status === 'Done'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-amber-500/10 text-amber-400'
                            }`}>
                              {task.status || 'Active'}
                            </span>
                          </div>
                          <div className="font-bold theme-heading text-[11px]">
                            {task.summary || task.name}
                          </div>
                        </div>

                        <div className="text-right shrink-0 font-mono text-[10px] theme-muted">
                          {task.assignee || 'Assigned Lead'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t theme-border shrink-0">
                <button
                  onClick={() => setSelectedMilestoneModal(null)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-[#FF5A14] text-white text-xs font-bold shadow-md hover:brightness-110 transition-all cursor-pointer"
                >
                  Close Tranche View
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      </div>
    </div>
  );
};

export default ProjectDrilldown;
