import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {
  Users,
  UserPlus,
  FileSpreadsheet,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Download,
  Upload,
  ArrowRight,
  Mail,
  ShieldCheck,
  Key,
  RotateCcw,
  Sparkles,
  Lock,
  ChevronRight,
  Loader2,
  Copy,
  ExternalLink,
  Plus,
  Search,
  X,
  Cloud,
  Database,
  RefreshCw,
  FolderSync
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useProject } from '../context/ProjectContext';
import {
  bulkCreateStakeholders,
  getStakeholders,
  updateStakeholder,
  deleteStakeholder,
  fetchJiraStakeholders,
  fetchGoogleDriveStakeholders
} from '../api/stakeholderApi';

const VALID_ROLES = ['Investor', 'Program Director', 'PMO', 'Project Manager'];

const AddStakeholderPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { activeProject } = useProject() || {};
  const fileInputRef = useRef(null);

  // Mode: 'manual' | 'excel' | 'jira' | 'gdrive'
  const [inputMode, setInputMode] = useState('manual');
  
  // Jira Sync State
  const [jiraKeyInput, setJiraKeyInput] = useState(
    activeProject?.jira_key && activeProject.jira_key !== 'ALL' ? activeProject.jira_key : ''
  );
  const [jiraSyncing, setJiraSyncing] = useState(false);

  // Google Drive Sync State
  const [gdriveSyncing, setGdriveSyncing] = useState(false);
  const [gdriveStatus, setGdriveStatus] = useState(null);
  
  // Workflow Step: 'input' | 'review' | 'success'
  const [currentStep, setCurrentStep] = useState('input');

  // Manual Form State: array of rows
  const [manualRows, setManualRows] = useState([
    { name: '', email: '', role: 'Investor' }
  ]);

  // Review List (editable items before final creation)
  const [reviewList, setReviewList] = useState([]);

  // Existing Stakeholders in System
  const [existingStakeholders, setExistingStakeholders] = useState([]);
  const [loadingExisting, setLoadingExisting] = useState(true);

  // Submitting state
  const [submitting, setSubmitting] = useState(false);
  const [createdResults, setCreatedResults] = useState([]);

  // Search & Role Filter for Registered Stakeholders Directory on the right
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Editing stakeholder state
  const [editingStakeholder, setEditingStakeholder] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'Investor' });
  const [savingEdit, setSavingEdit] = useState(false);

  // Deleting stakeholder state
  const [deletingStakeholder, setDeletingStakeholder] = useState(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  // Drag & drop state for excel
  const [isDragging, setIsDragging] = useState(false);

  // Fetch current stakeholders
  const loadStakeholders = async () => {
    try {
      setLoadingExisting(true);
      const res = await getStakeholders();
      setExistingStakeholders(res.stakeholders || []);
    } catch (err) {
      console.error('Failed to load existing stakeholders:', err);
    } finally {
      setLoadingExisting(false);
    }
  };

  useEffect(() => {
    loadStakeholders();
  }, []);

  // Filtered stakeholders for the right-hand directory panel
  const filteredStakeholders = existingStakeholders.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (s.name || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      (s.role || '').toLowerCase().includes(q);
    const matchesRole = roleFilter === 'ALL' || s.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // --- EDIT & DELETE STAKEHOLDER HANDLERS ---
  const handleOpenEdit = (s) => {
    setEditingStakeholder(s);
    setEditForm({ name: s.name, email: s.email, role: s.role });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      showToast('Full Name is required', 'error');
      return;
    }
    if (!editForm.email.trim() || !/\S+@\S+\.\S+/.test(editForm.email.trim())) {
      showToast('Valid Email Address is required', 'error');
      return;
    }

    try {
      setSavingEdit(true);
      const res = await updateStakeholder(editingStakeholder.id, editForm);
      showToast(res.message || 'Stakeholder updated successfully!', 'success');
      setEditingStakeholder(null);
      loadStakeholders();
    } catch (err) {
      console.error('Failed to update stakeholder:', err);
      const errMsg = err.response?.data?.error || 'Failed to update stakeholder.';
      showToast(errMsg, 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingStakeholder) return;
    try {
      setDeletingLoading(true);
      const res = await deleteStakeholder(deletingStakeholder.id);
      showToast(res.message || 'Stakeholder deleted from database.', 'success');
      setDeletingStakeholder(null);
      loadStakeholders();
    } catch (err) {
      console.error('Failed to delete stakeholder:', err);
      const errMsg = err.response?.data?.error || 'Failed to delete stakeholder.';
      showToast(errMsg, 'error');
    } finally {
      setDeletingLoading(false);
    }
  };

  // --- MANUAL FORM HANDLERS ---
  const handleManualRowChange = (index, field, value) => {
    setManualRows(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addManualRow = () => {
    setManualRows(prev => [...prev, { name: '', email: '', role: 'Investor' }]);
  };

  const removeManualRow = (index) => {
    if (manualRows.length === 1) {
      setManualRows([{ name: '', email: '', role: 'Investor' }]);
      return;
    }
    setManualRows(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleManualProceedToReview = (e) => {
    e.preventDefault();
    // Validate rows
    const cleaned = [];
    for (let i = 0; i < manualRows.length; i++) {
      const r = manualRows[i];
      const name = r.name.trim();
      const email = r.email.trim();
      if (!name && !email) continue; // Skip completely empty rows
      if (!name) {
        showToast(`Row ${i + 1}: Full Name is required`, 'error');
        return;
      }
      if (!email || !/\S+@\S+\.\S+/.test(email)) {
        showToast(`Row ${i + 1}: Valid email address is required`, 'error');
        return;
      }
      cleaned.push({
        id: `row-${Date.now()}-${i}`,
        name,
        email: email.toLowerCase(),
        role: r.role || 'Investor'
      });
    }

    if (cleaned.length === 0) {
      showToast('Please enter at least one stakeholder with Name and Email.', 'warning');
      return;
    }

    setReviewList(cleaned);
    setCurrentStep('review');
  };

  // --- EXCEL UPLOAD HANDLERS ---
  const handleFileUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!json || json.length === 0) {
          showToast('The uploaded Excel file appears to be empty.', 'error');
          return;
        }

        const parsed = [];
        json.forEach((row, idx) => {
          // Normalize column names (case-insensitive & whitespace-tolerant)
          let name = '';
          let email = '';
          let role = 'Investor';

          Object.keys(row).forEach(k => {
            const keyClean = k.trim().toLowerCase();
            if (keyClean === 'full name' || keyClean === 'name' || keyClean === 'fullname') {
              name = String(row[k]).trim();
            } else if (keyClean === 'email' || keyClean === 'email address' || keyClean === 'e-mail') {
              email = String(row[k]).trim().toLowerCase();
            } else if (keyClean === 'role' || keyClean === 'persona' || keyClean === 'user role') {
              const rVal = String(row[k]).trim();
              const match = VALID_ROLES.find(vr => vr.toLowerCase() === rVal.toLowerCase());
              if (match) role = match;
            }
          });

          if (name || email) {
            parsed.push({
              id: `excel-${Date.now()}-${idx}`,
              name: name || (email ? email.split('@')[0] : 'Stakeholder'),
              email: email || '',
              role: role || 'Investor'
            });
          }
        });

        if (parsed.length === 0) {
          showToast('Could not find Full Name or Email columns in the uploaded Excel.', 'error');
          return;
        }

        setReviewList(parsed);
        setCurrentStep('review');
        showToast(`Successfully extracted ${parsed.length} stakeholder(s). Please review details below.`, 'success');
      } catch (err) {
        console.error('Error parsing Excel file:', err);
        showToast('Failed to parse Excel file. Please ensure it is a valid .xlsx or .csv file.', 'error');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Download Sample Excel Template
  const downloadSampleTemplate = () => {
    const sampleData = [
      { 'Full Name': 'Alice Cooper', 'Email': 'alice.cooper@example.com', 'Role': 'Investor' },
      { 'Full Name': 'David Warner', 'Email': 'david.warner@example.com', 'Role': 'Program Director' },
      { 'Full Name': 'Samantha Miller', 'Email': 'samantha.miller@example.com', 'Role': 'PMO' },
      { 'Full Name': 'Rajesh Sharma', 'Email': 'rajesh.sharma@example.com', 'Role': 'Project Manager' }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stakeholders_Template');
    XLSX.writeFile(wb, 'vpm_stakeholders_template.xlsx');
    showToast('Downloaded sample Excel template.', 'info');
  };

  // --- JIRA & GOOGLE DRIVE CONNECTOR HANDLERS ---
  const handleFetchJiraStakeholders = async () => {
    try {
      setJiraSyncing(true);
      const res = await fetchJiraStakeholders(activeProject?.id, jiraKeyInput.trim());
      if (res.success && res.stakeholders && res.stakeholders.length > 0) {
        const mapped = res.stakeholders.map((u, idx) => ({
          id: `jira-${Date.now()}-${idx}`,
          name: u.name || '',
          email: u.email || '',
          role: VALID_ROLES.includes(u.role) ? u.role : 'Project Manager',
          source: u.source || 'Jira Cloud'
        }));
        setReviewList(mapped);
        setCurrentStep('review');
        showToast(`Fetched ${mapped.length} stakeholder(s) from Jira Cloud! Review and verify details below.`, 'success');
      } else if (res.success && (!res.stakeholders || res.stakeholders.length === 0)) {
        showToast('No assignable stakeholders found in Jira for this project or workspace.', 'info');
      } else {
        showToast(res.error || 'Failed to fetch stakeholders from Jira.', 'error');
      }
    } catch (err) {
      console.error('Jira fetch error:', err);
      const errMsg = err.response?.data?.error || 'Unable to connect to Jira Cloud. Please check credentials in Connectors Hub or .env.';
      showToast(errMsg, 'error');
    } finally {
      setJiraSyncing(false);
    }
  };

  const handleFetchGoogleDriveStakeholders = async () => {
    try {
      setGdriveSyncing(true);
      const res = await fetchGoogleDriveStakeholders(activeProject?.id);
      if (res.connected && res.stakeholders && res.stakeholders.length > 0) {
        const mapped = res.stakeholders.map((u, idx) => ({
          id: `gdrive-${Date.now()}-${idx}`,
          name: u.name || '',
          email: u.email || '',
          role: VALID_ROLES.includes(u.role) ? u.role : 'Project Manager',
          source: u.source || 'Google Drive'
        }));
        setReviewList(mapped);
        setCurrentStep('review');
        showToast(`Imported ${mapped.length} stakeholder(s) from Google Drive roster! Review details below.`, 'success');
      } else if (!res.connected) {
        setGdriveStatus({ connected: false, message: res.message });
        showToast('Google Drive is not connected yet for this project.', 'info');
      } else {
        showToast('No roster data found in connected Google Drive folder.', 'info');
      }
    } catch (err) {
      console.error('Google Drive fetch error:', err);
      const errMsg = err.response?.data?.error || 'Failed to fetch from Google Drive.';
      showToast(errMsg, 'error');
    } finally {
      setGdriveSyncing(false);
    }
  };

  // --- REVIEW TABLE EDIT HANDLERS ---
  const handleReviewRowChange = (id, field, value) => {
    setReviewList(prev =>
      prev.map(item => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleReviewRowDelete = (id) => {
    const updated = reviewList.filter(item => item.id !== id);
    if (updated.length === 0) {
      setReviewList([]);
      setCurrentStep('input');
    } else {
      setReviewList(updated);
    }
  };

  const handleReviewAddRow = () => {
    setReviewList(prev => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        name: '',
        email: '',
        role: 'Investor'
      }
    ]);
  };

  // --- FINAL SUBMIT: ACCEPT & CREATE ---
  const handleAcceptAndCreate = async () => {
    // Validate review list
    for (let i = 0; i < reviewList.length; i++) {
      const item = reviewList[i];
      if (!item.name.trim()) {
        showToast(`Row ${i + 1}: Name cannot be empty`, 'error');
        return;
      }
      if (!item.email.trim() || !/\S+@\S+\.\S+/.test(item.email.trim())) {
        showToast(`Row ${i + 1}: Invalid email address (${item.email})`, 'error');
        return;
      }
    }

    try {
      setSubmitting(true);
      const payload = reviewList.map(item => ({
        name: item.name.trim(),
        email: item.email.trim().toLowerCase(),
        role: item.role
      }));

      const res = await bulkCreateStakeholders(payload);
      setCreatedResults(res.results || []);
      setCurrentStep('success');
      showToast(res.message || 'Stakeholders created and credentials dispatched!', 'success');
      loadStakeholders();
    } catch (err) {
      console.error('Failed to create stakeholders:', err);
      const errMsg = err.response?.data?.error || 'Failed to create stakeholders.';
      showToast(errMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Copy helper
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!', 'info');
  };

  return (
    <div className="space-y-3.5 w-full max-w-[1750px] mx-auto px-4 sm:px-6 py-2.5">

      {/* TOP HERO HEADER - COMPACT */}
      <div className="p-3.5 sm:p-4 rounded-2xl theme-card border border-white/10 shadow-lg relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-[#FF5A14]/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF5A14] to-[#E04808] flex items-center justify-center text-white shadow-[0_0_15px_rgba(255,90,20,0.35)] flex-shrink-0">
              <UserPlus size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-[#FF5A14]/15 text-[#FF5A14] border border-[#FF5A14]/30">
                  PMO Governance Portal
                </span>
                <span className="text-[11px] theme-muted font-mono">
                  Role: PMO Lead
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black theme-heading tracking-tight">
                Add & Onboard Stakeholders
              </h1>
            </div>
          </div>
          <p className="text-xs theme-muted max-w-xl hidden md:block">
            Enroll project stakeholders via Manual, Excel, Jira Cloud or Google Drive. Credentials dispatched upon confirmation.
          </p>
        </div>
      </div>

      {/* WORKFLOW STEP INDICATOR - COMPACT */}
      <div className="flex items-center justify-center">
        <div className="inline-flex items-center p-1 rounded-xl theme-subtle border theme-border shadow-xs">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
            currentStep === 'input' ? 'bg-[#FF5A14] text-white shadow-sm' : 'theme-muted'
          }`}>
            <span className="w-4 h-4 rounded-full bg-black/20 flex items-center justify-center text-[9px] font-mono">1</span>
            <span>Select Method & Input</span>
          </div>

          <ChevronRight size={14} className="text-slate-500 mx-0.5" />

          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
            currentStep === 'review' ? 'bg-[#FF5A14] text-white shadow-sm' : 'theme-muted'
          }`}>
            <span className="w-4 h-4 rounded-full bg-black/20 flex items-center justify-center text-[9px] font-mono">2</span>
            <span>Review & Edit Details</span>
          </div>

          <ChevronRight size={14} className="text-slate-500 mx-0.5" />

          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
            currentStep === 'success' ? 'bg-[#FF5A14] text-white shadow-sm' : 'theme-muted'
          }`}>
            <span className="w-4 h-4 rounded-full bg-black/20 flex items-center justify-center text-[9px] font-mono">3</span>
            <span>Accepted & Credentials Sent</span>
          </div>
        </div>
      </div>

      {/* 2-COLUMN WORKSPACE: LEFT (MANUAL/EXCEL ONBOARDING) & RIGHT (REGISTERED STAKEHOLDERS DIRECTORY) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* LEFT COLUMN: ONBOARDING ENGINE (MANUAL/EXCEL / REVIEW / SUCCESS) */}
        <div className="lg:col-span-7 xl:col-span-7 space-y-4">

          {/* STEP 1: METHOD SELECTION & INPUT (MANUAL FORM OR EXCEL) */}
          {currentStep === 'input' && (
            <div className="p-5 sm:p-6 rounded-2xl theme-card border border-white/10 shadow-lg space-y-4">
              
              {/* Method Tabs */}
              <div className="flex flex-wrap items-center gap-2.5 border-b theme-border pb-4">
                <button
                  type="button"
                  onClick={() => setInputMode('manual')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    inputMode === 'manual'
                      ? 'bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white shadow-md'
                      : 'theme-subtle hover:bg-white/5 theme-muted'
                  }`}
                >
                  <Edit3 size={15} />
                  <span>Manual Entry</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInputMode('excel')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    inputMode === 'excel'
                      ? 'bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white shadow-md'
                      : 'theme-subtle hover:bg-white/5 theme-muted'
                  }`}
                >
                  <FileSpreadsheet size={15} />
                  <span>Excel / CSV Upload</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInputMode('jira')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    inputMode === 'jira'
                      ? 'bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white shadow-md'
                      : 'theme-subtle hover:bg-white/5 theme-muted'
                  }`}
                >
                  <Cloud size={15} />
                  <span>Jira Cloud Sync</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </button>

                <button
                  type="button"
                  onClick={() => setInputMode('gdrive')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    inputMode === 'gdrive'
                      ? 'bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white shadow-md'
                      : 'theme-subtle hover:bg-white/5 theme-muted'
                  }`}
                >
                  <Database size={15} />
                  <span>Google Drive Sync</span>
                </button>
              </div>

              {/* METHOD 1: MANUAL FORM */}
              {inputMode === 'manual' && (
                <form onSubmit={handleManualProceedToReview} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold theme-heading">Manual Stakeholder Roster Entry</h3>
                      <p className="text-[11px] theme-muted">Only Full Name, Email, and Role are required.</p>
                    </div>

                    <button
                      type="button"
                      onClick={addManualRow}
                      className="px-3 py-1.5 rounded-lg border border-[#FF5A14]/30 hover:border-[#FF5A14] bg-[#FF5A14]/10 hover:bg-[#FF5A14]/20 text-[#FF5A14] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus size={13} />
                      <span>Add Another Row</span>
                    </button>
                  </div>

                  {/* Input Rows List with internal scroll */}
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 no-scrollbar">
                    {manualRows.map((row, idx) => (
                      <div key={idx} className="p-3 rounded-xl theme-subtle border theme-border flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-black/30 border border-slate-300 dark:border-white/10 flex items-center justify-center font-mono text-[10px] font-bold text-slate-700 dark:text-slate-400 flex-shrink-0">
                          {idx + 1}
                        </span>

                        {/* Full Name */}
                        <div className="flex-1">
                          <label className="text-[9px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-0.5">
                            Full Name <span className="text-[#FF5A14]">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Alice Cooper"
                            value={row.name}
                            onChange={(e) => handleManualRowChange(idx, 'name', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-[#0E1422] border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#FF5A14] focus:ring-1 focus:ring-[#FF5A14] transition-all"
                          />
                        </div>

                        {/* Email */}
                        <div className="flex-1">
                          <label className="text-[9px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-0.5">
                            Email Address <span className="text-[#FF5A14]">*</span>
                          </label>
                          <input
                            type="email"
                            placeholder="e.g. alice@example.com"
                            value={row.email}
                            onChange={(e) => handleManualRowChange(idx, 'email', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-[#0E1422] border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#FF5A14] focus:ring-1 focus:ring-[#FF5A14] transition-all"
                          />
                        </div>

                        {/* Role Selection */}
                        <div className="w-full md:w-48">
                          <label className="text-[9px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-0.5">
                            System Role <span className="text-[#FF5A14]">*</span>
                          </label>
                          <select
                            value={row.role}
                            onChange={(e) => handleManualRowChange(idx, 'role', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-[#0E1422] border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-[#FF5A14] focus:ring-1 focus:ring-[#FF5A14] cursor-pointer transition-all"
                          >
                            {VALID_ROLES.map(r => (
                              <option key={r} value={r} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{r}</option>
                            ))}
                          </select>
                        </div>

                        {/* Delete row button */}
                        <button
                          type="button"
                          onClick={() => removeManualRow(idx)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-all self-end md:self-auto cursor-pointer"
                          title="Remove row"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white text-xs font-bold shadow-[0_0_15px_rgba(255,90,20,0.3)] hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <span>Proceed to Review & Verification</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </form>
              )}

              {/* METHOD 2: EXCEL UPLOAD */}
              {inputMode === 'excel' && (
                <div className="space-y-4">
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-6 sm:p-7 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-between gap-4 ${
                      isDragging
                        ? 'border-[#FF5A14] bg-[#FF5A14]/10 scale-[1.01]'
                        : 'border-white/15 hover:border-[#FF5A14]/60 bg-white/[0.02] hover:bg-white/[0.04]'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(e.target.files[0]);
                        }
                      }}
                    />

                    <div className="flex items-center gap-4 text-left">
                      <div className="w-12 h-12 rounded-2xl bg-[#FF5A14]/15 text-[#FF5A14] border border-[#FF5A14]/30 flex items-center justify-center flex-shrink-0">
                        <Upload size={24} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold theme-heading">
                          Drag & Drop Stakeholder Spreadsheet
                        </h4>
                        <p className="text-xs theme-muted mt-0.5">
                          Upload an Excel (.xlsx, .xls) or CSV file with <strong>Full Name</strong>, <strong>Email</strong>, and <strong>Role</strong> columns.
                        </p>
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold theme-heading flex-shrink-0 hover:bg-white/10 transition-all">
                      <FileSpreadsheet size={15} className="text-[#FF5A14]" />
                      <span>Browse Files</span>
                    </div>
                  </div>

                  {/* Excel Format Guidelines Card */}
                  <div className="p-3.5 rounded-2xl theme-subtle border theme-border flex items-center gap-3">
                    <AlertCircle size={16} className="text-[#FF5A14] flex-shrink-0" />
                    <div className="text-[11px] theme-muted">
                      <strong className="theme-heading mr-1">Required Headers:</strong>
                      <code className="text-[#FF7A45] font-mono">Full Name</code>, <code className="text-[#FF7A45] font-mono">Email</code>, and <code className="text-[#FF7A45] font-mono">Role</code> (Investor, Program Director, PMO, or Project Manager).
                    </div>
                  </div>
                </div>
              )}

              {/* METHOD 3: JIRA CLOUD SYNC */}
              {inputMode === 'jira' && (
                <div className="space-y-3.5">
                  {/* Status Banner */}
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-blue-500/5 border border-blue-500/20 flex items-center justify-between flex-wrap gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold shadow-inner flex-shrink-0">
                        <Cloud size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold theme-heading">Atlassian Jira Cloud Integration</h4>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            Live & Connected
                          </span>
                        </div>
                        <p className="text-[11px] theme-muted font-mono mt-0.5">
                          Host: <span className="text-slate-700 dark:text-slate-300 font-semibold">dipakkrsaha44.atlassian.net</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-[10px] font-mono theme-muted px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-black/30 border border-slate-200 dark:border-white/5">
                      Auth: <span className="text-slate-800 dark:text-slate-200 font-semibold">dipakkrsaha44@gmail.com</span>
                    </div>
                  </div>

                  {/* Project Key & Fetch Action Box */}
                  <div className="p-4 sm:p-4.5 rounded-xl theme-subtle border theme-border space-y-3">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <label className="text-xs font-bold theme-heading">
                          Jira Project Key (Optional)
                        </label>
                        {activeProject?.jira_key && activeProject.jira_key !== 'ALL' && (
                          <button
                            type="button"
                            onClick={() => setJiraKeyInput(activeProject.jira_key)}
                            className="text-[11px] font-semibold text-[#FF5A14] hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <span>Fill Active Project:</span>
                            <span className="font-mono font-bold bg-[#FF5A14]/10 px-1.5 py-0.5 rounded">{activeProject.jira_key}</span>
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] theme-muted mb-2">
                        Filter and pull assignees from a specific Jira project, or leave blank to retrieve all workspace project team members.
                      </p>
                      
                      <input
                        type="text"
                        placeholder="e.g. PRJ, PROJ or leave blank for all workspace users"
                        value={jiraKeyInput}
                        onChange={(e) => setJiraKeyInput(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#0E1422] border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#FF5A14] focus:ring-1 focus:ring-[#FF5A14] transition-all"
                      />
                    </div>

                    {/* Bottom Action Row */}
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t theme-border">
                      <div className="text-[11px] theme-muted flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-[#FF5A14] flex-shrink-0" />
                        <span>Loaded into Step 2 for role review before creation.</span>
                      </div>

                      <button
                        type="button"
                        onClick={handleFetchJiraStakeholders}
                        disabled={jiraSyncing}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white text-xs font-bold shadow-[0_0_15px_rgba(255,90,20,0.3)] hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer flex-shrink-0"
                      >
                        {jiraSyncing ? (
                          <>
                            <Loader2 size={15} className="animate-spin" />
                            <span>Querying Jira...</span>
                          </>
                        ) : (
                          <>
                            <Cloud size={15} />
                            <span>Fetch Project Stakeholders from Jira</span>
                            <ArrowRight size={13} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* METHOD 4: GOOGLE DRIVE SYNC */}
              {inputMode === 'gdrive' && (
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-500/20 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shadow-inner flex-shrink-0">
                        <Database size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold theme-heading">Google Drive Enterprise Connector</h4>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Enterprise Roster Sync
                          </span>
                        </div>
                        <p className="text-[11px] theme-muted mt-0.5">
                          Pull stakeholder rosters directly from designated Google Drive spreadsheets or folders.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Connect / Fetch Card */}
                  <div className="p-4 sm:p-5 rounded-2xl theme-subtle border theme-border space-y-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-bold theme-heading mb-0.5">
                          Drive Roster Synchronization
                        </h4>
                        <p className="text-[11px] theme-muted">
                          Click below to scan the connected Google Drive folder for <code className="text-[#FF5A14] font-mono">Stakeholder_Roster.xlsx</code>.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleFetchGoogleDriveStakeholders}
                        disabled={gdriveSyncing}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white text-xs font-bold shadow-[0_0_20px_rgba(255,90,20,0.35)] hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer flex-shrink-0"
                      >
                        {gdriveSyncing ? (
                          <>
                            <Loader2 size={15} className="animate-spin" />
                            <span>Scanning Drive...</span>
                          </>
                        ) : (
                          <>
                            <Database size={15} />
                            <span>Fetch Roster from Drive</span>
                            <ArrowRight size={13} />
                          </>
                        )}
                      </button>
                    </div>

                    {gdriveStatus && !gdriveStatus.connected && (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2">
                          <AlertCircle size={15} className="text-amber-500 flex-shrink-0" />
                          <span className="text-slate-700 dark:text-slate-300 text-[11px]">
                            {gdriveStatus.message || 'Google Drive connector is not yet connected for this project.'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate('/settings')}
                          className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-600 dark:text-amber-300 text-[11px] font-bold border border-amber-500/30 transition-all flex items-center gap-1 self-start sm:self-auto cursor-pointer flex-shrink-0"
                        >
                          <ExternalLink size={12} />
                          <span>Connectors Hub</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* STEP 2: REVIEW & INLINE EDITING TABLE (PRE-SAVE VERIFICATION) */}
          {currentStep === 'review' && (
            <div className="p-5 sm:p-6 rounded-2xl theme-card border border-white/10 shadow-lg space-y-3.5">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b theme-border pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold theme-heading">
                      Review & Verify Stakeholders Before Creating
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FF5A14]/15 text-[#FF5A14] border border-[#FF5A14]/30">
                      {reviewList.length} Entries
                    </span>
                  </div>
                  <p className="text-[11px] theme-muted mt-0.5">
                    Click any cell directly to modify names, fix spelling mistakes, or update assigned roles.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleReviewAddRow}
                    className="px-3 py-1.5 rounded-lg border border-white/10 hover:border-[#FF5A14]/50 bg-white/5 text-xs font-bold theme-heading transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus size={13} className="text-[#FF5A14]" />
                    <span>Add Row</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setReviewList([]);
                      setCurrentStep('input');
                    }}
                    className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-xs font-bold theme-muted transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw size={13} />
                    <span>Start Over</span>
                  </button>
                </div>
              </div>

              {/* Editable Review Table with internal scroll */}
              <div className="overflow-x-auto max-h-[260px] overflow-y-auto rounded-xl border theme-border no-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b theme-border bg-slate-100 dark:bg-black/30 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      <th className="py-3 px-4 w-12">#</th>
                      <th className="py-3 px-4">Full Name (Editable)</th>
                      <th className="py-3 px-4">Email Address (Editable)</th>
                      <th className="py-3 px-4 w-52">Role</th>
                      <th className="py-3 px-4 w-20 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y theme-border text-xs">
                    {reviewList.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-500 font-bold">
                          {idx + 1}
                        </td>

                        {/* Editable Name */}
                        <td className="py-2.5 px-4">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleReviewRowChange(item.id, 'name', e.target.value)}
                            placeholder="Stakeholder Name"
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0E1422] border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-[#FF5A14] focus:ring-1 focus:ring-[#FF5A14] transition-all"
                          />
                        </td>

                        {/* Editable Email */}
                        <td className="py-2.5 px-4">
                          <input
                            type="email"
                            value={item.email}
                            onChange={(e) => handleReviewRowChange(item.id, 'email', e.target.value)}
                            placeholder="email@example.com"
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0E1422] border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-[#FF5A14] focus:ring-1 focus:ring-[#FF5A14] transition-all"
                          />
                        </td>

                        {/* Role Dropdown */}
                        <td className="py-2.5 px-4">
                          <select
                            value={item.role}
                            onChange={(e) => handleReviewRowChange(item.id, 'role', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0E1422] border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-[#FF5A14] focus:ring-1 focus:ring-[#FF5A14] cursor-pointer transition-all"
                          >
                            {VALID_ROLES.map(r => (
                              <option key={r} value={r} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{r}</option>
                            ))}
                          </select>
                        </td>

                        {/* Delete Action */}
                        <td className="py-2.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleReviewRowDelete(item.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Remove row"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action Footer */}
              <div className="pt-4 border-t theme-border flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs theme-muted">
                  <Mail size={15} className="text-[#FF5A14]" />
                  <span>Default login credentials and access link will be dispatched automatically to each email.</span>
                </div>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleAcceptAndCreate}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white text-xs font-bold shadow-[0_0_25px_rgba(255,90,20,0.4)] hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer self-stretch sm:self-auto justify-center"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  <span>{submitting ? 'Creating & Dispatching Emails...' : 'Accept & Create Stakeholders'}</span>
                </button>
              </div>

            </div>
          )}

          {/* STEP 3: SUCCESS & CREDENTIAL DISPATCH SUMMARY */}
          {currentStep === 'success' && (
            <div className="p-5 sm:p-6 rounded-2xl theme-card border border-[#FF5A14]/30 shadow-xl space-y-4">
              
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#FF5A14]/15 text-[#FF5A14] border border-[#FF5A14]/30 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black theme-heading">
                    Stakeholders Successfully Created & Dispatched!
                  </h3>
                  <p className="text-xs theme-muted mt-0.5">
                    {createdResults.length} stakeholder account(s) have been saved to the database. Initial default credentials and login instructions were emailed to each user.
                  </p>
                </div>
              </div>

              {/* Results Table */}
              <div className="overflow-x-auto max-h-[250px] overflow-y-auto rounded-xl border theme-border no-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b theme-border bg-black/20 text-[11px] font-bold uppercase tracking-wider theme-muted">
                      <th className="py-2.5 px-4">Full Name</th>
                      <th className="py-2.5 px-4">Email</th>
                      <th className="py-2.5 px-4">Role</th>
                      <th className="py-2.5 px-4">Default Password</th>
                      <th className="py-2.5 px-4">Email Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y theme-border text-xs">
                    {createdResults.map((r, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.02]">
                        <td className="py-2.5 px-4 font-bold theme-heading">{r.name}</td>
                        <td className="py-2.5 px-4 font-mono text-slate-300">{r.email}</td>
                        <td className="py-2.5 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FF5A14]/15 text-[#FF5A14] border border-[#FF5A14]/30">
                            {r.role}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <code className="font-mono text-[#FF7A45] font-bold bg-black/30 px-2 py-0.5 rounded text-xs">
                              {r.default_password}
                            </code>
                            <button
                              onClick={() => copyToClipboard(r.default_password)}
                              className="p-1 text-slate-400 hover:text-white"
                              title="Copy Password"
                            >
                              <Copy size={13} />
                            </button>
                          </div>
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="text-emerald-400 font-bold flex items-center gap-1.5 text-xs">
                            <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
                            <span>Mail Sent</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setManualRows([{ name: '', email: '', role: 'Investor' }]);
                    setReviewList([]);
                    setCurrentStep('input');
                  }}
                  className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-bold theme-heading transition-all cursor-pointer"
                >
                  Add More Stakeholders
                </button>
                <button
                  onClick={() => navigate('/projects')}
                  className="px-5 py-2 rounded-xl bg-[#FF5A14] text-white text-xs font-bold shadow-md hover:brightness-110 transition-all cursor-pointer"
                >
                  Back to Projects Hub
                </button>
              </div>

            </div>
          )}

        </div>

        {/* RIGHT COLUMN: REGISTERED STAKEHOLDERS DIRECTORY */}
        <div className="lg:col-span-5 xl:col-span-5 p-4 sm:p-5 rounded-2xl theme-card border border-white/10 shadow-lg space-y-3 sticky top-3">
          <div className="flex items-center justify-between pb-2.5 border-b theme-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FF5A14]/15 text-[#FF5A14] border border-[#FF5A14]/30 flex items-center justify-center flex-shrink-0">
                <Users size={16} />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold theme-heading">
                  Stakeholders Directory
                </h3>
                <span className="text-[10px] theme-muted block">
                  Registered system accounts
                </span>
              </div>
            </div>

            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300">
              {filteredStakeholders.length} of {existingStakeholders.length}
            </span>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-[#0E1422] border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#FF5A14] transition-all"
            />
          </div>

          {/* Role Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {['ALL', 'Investor', 'Program Director', 'PMO', 'Project Manager'].map((rf) => (
              <button
                key={rf}
                onClick={() => setRoleFilter(rf)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer ${
                  roleFilter === rf
                    ? 'bg-[#FF5A14] text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-white hover:bg-[#FF5A14]/20 border border-slate-200 dark:border-white/5'
                }`}
              >
                {rf === 'Program Director' ? 'Director' : rf === 'Project Manager' ? 'PM' : rf}
              </button>
            ))}
          </div>

          {/* Scrollable list of stakeholders - compact to avoid page scroll */}
          {loadingExisting ? (
            <div className="py-10 flex items-center justify-center text-xs theme-muted gap-2">
              <Loader2 size={15} className="animate-spin text-[#FF5A14]" />
              <span>Loading directory...</span>
            </div>
          ) : filteredStakeholders.length === 0 ? (
            <div className="py-10 text-center text-xs theme-muted">
              No matching stakeholders found.
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
              {filteredStakeholders.map((u) => (
                <div key={u.id} className="p-3 rounded-2xl theme-subtle border theme-border hover:border-[#FF5A14]/40 transition-all flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF5A14]/20 to-[#FF7A45]/10 text-[#FF5A14] border border-[#FF5A14]/30 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {(u.name || u.email || 'U')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-xs font-bold theme-heading truncate">{u.name}</h5>
                      <span className="text-[11px] theme-muted font-mono block truncate" title={u.email}>{u.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-[#FF5A14]/15 text-[#FF5A14] border border-[#FF5A14]/30">
                      {u.role}
                    </span>
                    <button
                      onClick={() => handleOpenEdit(u)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-[#FF7A45] hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      title="Edit Stakeholder"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={() => setDeletingStakeholder(u)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Delete Stakeholder"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ========================================================= */}
      {/* EDIT STAKEHOLDER MODAL DIALOG                              */}
      {/* ========================================================= */}
      {editingStakeholder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="max-w-md w-full bg-white dark:bg-[#131A29] rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-white/15 shadow-2xl relative overflow-hidden space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#FF5A14]/15 text-[#FF5A14] border border-[#FF5A14]/30 flex items-center justify-center">
                  <Edit3 size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">Edit Stakeholder</h4>
                  <span className="text-[11px] text-[#FF5A14] font-mono">DB User ID: #{editingStakeholder.id}</span>
                </div>
              </div>

              <button
                onClick={() => setEditingStakeholder(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Full Name <span className="text-[#FF5A14]">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Stakeholder Name"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0E1422] border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#FF5A14] focus:ring-1 focus:ring-[#FF5A14] transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Email Address <span className="text-[#FF5A14]">*</span>
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="email@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0E1422] border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white font-mono placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#FF5A14] focus:ring-1 focus:ring-[#FF5A14] transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  System Role <span className="text-[#FF5A14]">*</span>
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0E1422] border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-[#FF5A14] focus:ring-1 focus:ring-[#FF5A14] cursor-pointer transition-all"
                >
                  {VALID_ROLES.map(r => (
                    <option key={r} value={r} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{r}</option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingStakeholder(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white font-bold shadow-md hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {savingEdit ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  <span>{savingEdit ? 'Updating DB...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DELETE STAKEHOLDER CONFIRMATION MODAL                      */}
      {/* ========================================================= */}
      {deletingStakeholder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="max-w-sm w-full bg-white dark:bg-[#131A29] rounded-3xl p-6 border border-red-500/30 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-500/15 text-red-500 border border-red-500/30 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>

            <div>
              <h4 className="text-base font-black text-slate-900 dark:text-white">Delete Stakeholder?</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Are you sure you want to permanently delete <strong className="text-slate-900 dark:text-white">{deletingStakeholder.name}</strong> ({deletingStakeholder.email})? This will remove their record from the database.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingStakeholder(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingLoading}
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold shadow-md hover:shadow-red-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {deletingLoading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                <span>{deletingLoading ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AddStakeholderPage;
