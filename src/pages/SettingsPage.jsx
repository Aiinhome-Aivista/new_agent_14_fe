import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { settingsApi } from '../api/settingsApi';
import { useToast } from '../context/ToastContext';
import { 
  Save, Server, GitBranch, Database, FileText, Bell, Clock, 
  Sparkles, CheckCircle2, AlertCircle, Loader2, Activity, RefreshCw 
} from 'lucide-react';
import FuturisticLoader from '../components/common/FuturisticLoader';

const PROVIDERS = [
  {
    id: 'jira',
    name: 'Jira Cloud',
    icon: Server,
    color: 'text-blue-500',
    borderActive: 'border-blue-500',
    bgActive: 'bg-blue-500/10',
    desc: 'Atlassian Jira Agile Sprint, Epics & Blocker Tracking',
    urlLabel: 'Jira Base URL',
    urlPlaceholder: 'https://your-domain.atlassian.net',
    userLabel: 'Service Account Email',
    userPlaceholder: 'integration@enterprise.com',
    tokenLabel: 'Atlassian API Token'
  },
  {
    id: 'azure_devops',
    name: 'Azure DevOps',
    icon: GitBranch,
    color: 'text-sky-500',
    borderActive: 'border-sky-500',
    bgActive: 'bg-sky-500/10',
    desc: 'Microsoft Azure DevOps Boards, Sprints & Burndown Velocity',
    urlLabel: 'Organization URL',
    urlPlaceholder: 'https://dev.azure.com/your-org',
    userLabel: 'Project Name / Service Principal',
    userPlaceholder: 'VPM-Program-Alpha',
    tokenLabel: 'Personal Access Token (PAT)'
  },
  {
    id: 'sap_erp',
    name: 'SAP ERP S/4HANA',
    icon: Database,
    color: 'text-emerald-500',
    borderActive: 'border-emerald-500',
    bgActive: 'bg-emerald-500/10',
    desc: 'Enterprise Cost Centers, Budget Allocations & Capex/Opex Feeds',
    urlLabel: 'S/4HANA OData Endpoint',
    urlPlaceholder: 'https://s4hana-erp.enterprise.com/sap/opu/odata/sap',
    userLabel: 'ERP System User / Client ID',
    userPlaceholder: 'ERP_SVC_USER',
    tokenLabel: 'System Secret / Basic Auth Key'
  },
  {
    id: 'sharepoint',
    name: 'SharePoint / M365',
    icon: FileText,
    color: 'text-indigo-500',
    borderActive: 'border-indigo-500',
    bgActive: 'bg-indigo-500/10',
    desc: 'Governance Charters, Steering Committee MOMs & SOW Repositories',
    urlLabel: 'SharePoint Site Collection URL',
    urlPlaceholder: 'https://tenant.sharepoint.com/sites/pmo-governance',
    userLabel: 'Azure AD Tenant ID / App ID',
    userPlaceholder: 'tenant-id-sandbox-7729',
    tokenLabel: 'Client Secret / Graph API Key'
  },
  {
    id: 'notifications',
    name: 'Slack & Teams',
    icon: Bell,
    color: 'text-amber-500',
    borderActive: 'border-amber-500',
    bgActive: 'bg-amber-500/10',
    desc: 'Critical Risk & Threshold Escalation Webhook Broadcasts',
    urlLabel: 'Webhook Endpoint URL',
    urlPlaceholder: 'https://hooks.slack.com/services/...',
    userLabel: 'Target Channel / Bot Handle',
    userPlaceholder: '#pmo-executive-escalations',
    tokenLabel: 'Signing Secret / Token'
  },
  {
    id: 'scheduler',
    name: 'Autonomous Sync',
    icon: Clock,
    color: 'text-[#FF5A14]',
    borderActive: 'border-[#FF5A14]',
    bgActive: 'bg-[#FF5A14]/10',
    desc: 'Background Sync Daemon, Polling Intervals & Cross-Tool Health'
  }
];

const SettingsPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState('jira');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [seedingAll, setSeedingAll] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Settings stored per provider
  const [allSettings, setAllSettings] = useState({
    jira: { base_url: '', username_email: '', api_token: '' },
    azure_devops: { base_url: '', username_email: '', api_token: '' },
    sap_erp: { base_url: '', username_email: '', api_token: '' },
    sharepoint: { base_url: '', username_email: '', api_token: '' },
    notifications: { base_url: '', username_email: '', api_token: '' }
  });

  // Scheduler state
  const [schedulerStatus, setSchedulerStatus] = useState(null);
  const [syncingScheduler, setSyncingScheduler] = useState(false);

  const canEdit = ['PMO', 'Program Director'].includes(user?.role);

  const loadAll = async () => {
    try {
      setLoading(true);
      const res = await settingsApi.getAllSettings();
      if (res.settings) {
        const updated = { ...allSettings };
        res.settings.forEach(item => {
          if (updated[item.provider]) {
            updated[item.provider] = {
              base_url: item.base_url || '',
              username_email: item.username_email || '',
              api_token: ''
            };
          }
        });
        setAllSettings(updated);
      }

      // Fetch scheduler status
      try {
        const schedRes = await settingsApi.getSchedulerStatus();
        if (schedRes.data) {
          setSchedulerStatus(schedRes.data);
        }
      } catch (sErr) {
        console.warn("Scheduler status fetch warning:", sErr);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
      showToast("Failed to load enterprise settings.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleFieldChange = (provider, field, value) => {
    setAllSettings(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value
      }
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!canEdit || activeTab === 'scheduler') return;
    
    try {
      setSaving(true);
      const current = allSettings[activeTab];
      await settingsApi.saveProviderSettings(activeTab, current);
      showToast(`${PROVIDERS.find(p => p.id === activeTab)?.name} configuration saved successfully!`, "success");
      // Clear token input for security
      setAllSettings(prev => ({
        ...prev,
        [activeTab]: { ...prev[activeTab], api_token: '' }
      }));
    } catch (err) {
      console.error("Failed to save settings:", err);
      showToast(`Failed to save ${activeTab} configuration.`, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (activeTab === 'scheduler') return;
    try {
      setTesting(true);
      setTestResult(null);
      const result = await settingsApi.testProviderConnection(activeTab);
      setTestResult(result);
      if (result.success) {
        showToast(`Connected successfully! Server: ${result.server || 'OK'}`, "success");
      } else {
        showToast(`Connection failed: ${result.error || 'Unknown error'}`, "error");
      }
    } catch (err) {
      console.error("Test connection failed:", err);
      const errMsg = err.response?.data?.error || err.message || "Failed to test connection.";
      setTestResult({ success: false, error: errMsg });
      showToast(errMsg, "error");
    } finally {
      setTesting(false);
    }
  };

  const handleLoadDemoPresets = async (targetProvider = null) => {
    try {
      if (targetProvider) {
        setTesting(true);
      } else {
        setSeedingAll(true);
      }
      const res = await settingsApi.loadDemoPresets(targetProvider);
      if (res.data) {
        setAllSettings(prev => {
          const next = { ...prev };
          Object.keys(res.data).forEach(p => {
            if (next[p]) {
              next[p] = {
                base_url: res.data[p].base_url || '',
                username_email: res.data[p].username_email || '',
                api_token: res.data[p].api_token || ''
              };
            }
          });
          return next;
        });
        showToast(res.message || "Demo sandbox credentials loaded!", "success");
      }
    } catch (err) {
      console.error("Failed to load demo presets:", err);
      showToast("Failed to load demo sandbox credentials.", "error");
    } finally {
      setTesting(false);
      setSeedingAll(false);
    }
  };

  const handleTriggerSync = async () => {
    try {
      setSyncingScheduler(true);
      const res = await settingsApi.triggerSchedulerSync();
      showToast(res.message || "Manual sync sweep triggered!", "success");
      // Refresh status after 2 seconds
      setTimeout(async () => {
        try {
          const schedRes = await settingsApi.getSchedulerStatus();
          if (schedRes.data) setSchedulerStatus(schedRes.data);
        } catch (e) {}
        setSyncingScheduler(false);
      }, 2000);
    } catch (err) {
      setSyncingScheduler(false);
      showToast("Failed to trigger background scheduler.", "error");
    }
  };

  if (loading) {
    return (
      <FuturisticLoader 
        title="Loading Enterprise Connectors..." 
        subtitle="Verifying encrypted credentials and bidirectional webhook channels"
      />
    );
  }

  const currentProviderDef = PROVIDERS.find(p => p.id === activeTab);
  const currentSettings = allSettings[activeTab] || { base_url: '', username_email: '', api_token: '' };

  return (
    <div className="py-2 max-w-5xl space-y-6">
      {/* Header with Global 1-Click Sandbox Seeder */}
      <div className="pb-4 border-b theme-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black theme-heading tracking-tight">Enterprise Connectors Hub</h1>
          <p className="text-xs sm:text-sm theme-muted mt-1">
            Configure enterprise integrations with automated bidirectional sync and verified sandboxes.
          </p>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={() => handleLoadDemoPresets(null)}
            disabled={seedingAll}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {seedingAll ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            <span>1-Click Seed All Demo Sandboxes</span>
          </button>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b theme-border">
        {PROVIDERS.map((prov) => {
          const Icon = prov.icon;
          const isActive = activeTab === prov.id;
          return (
            <button
              key={prov.id}
              onClick={() => {
                setActiveTab(prov.id);
                setTestResult(null);
              }}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive 
                  ? 'bg-[#FF5A14] text-white shadow-md' 
                  : 'theme-subtle hover:theme-subtle-hover theme-heading border theme-border'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-white' : prov.color} />
              <span>{prov.name}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content: Scheduler Panel */}
      {activeTab === 'scheduler' ? (
        <div className="theme-card rounded-2xl overflow-hidden shadow-sm border theme-border">
          <div className="p-6 border-b theme-border flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#FF5A14]/10 text-[#FF5A14] rounded-xl border border-[#FF5A14]/20">
                <Clock size={22} />
              </div>
              <div>
                <h2 className="text-base font-bold theme-heading">Autonomous Background Sync Engine</h2>
                <p className="text-xs theme-muted">Daemon worker periodically polling external connectors and refreshing executive snapshots.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleTriggerSync}
              disabled={syncingScheduler}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white rounded-xl text-xs font-bold shadow hover:brightness-110 disabled:opacity-50 transition-all"
            >
              {syncingScheduler ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              <span>{syncingScheduler ? 'Syncing...' : 'Trigger Sync Now'}</span>
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl theme-subtle border theme-border">
                <span className="text-[11px] theme-muted font-medium">Scheduler State</span>
                <div className="mt-1 flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${schedulerStatus?.is_running ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                  <span className="text-sm font-bold theme-heading">
                    {schedulerStatus?.is_running ? 'Active (Daemon Running)' : 'Idle'}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl theme-subtle border theme-border">
                <span className="text-[11px] theme-muted font-medium">Sync Interval</span>
                <div className="mt-1 text-sm font-bold theme-heading">
                  {Math.round((schedulerStatus?.interval_seconds || 3600) / 60)} minutes
                </div>
              </div>

              <div className="p-4 rounded-xl theme-subtle border theme-border">
                <span className="text-[11px] theme-muted font-medium">Total Sweeps Executed</span>
                <div className="mt-1 text-sm font-bold theme-heading">
                  #{schedulerStatus?.sync_count ?? 0} cycles
                </div>
              </div>

              <div className="p-4 rounded-xl theme-subtle border theme-border">
                <span className="text-[11px] theme-muted font-medium">Last Sweep Status</span>
                <div className="mt-1 flex items-center gap-1.5">
                  {schedulerStatus?.last_status === 'success' ? (
                    <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                      <CheckCircle2 size={14} /> Synced Cleanly
                    </span>
                  ) : schedulerStatus?.last_status === 'syncing' ? (
                    <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                      <Loader2 size={14} className="animate-spin" /> In Progress
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-slate-400">Ready</span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 text-slate-200 border border-slate-800 font-mono text-xs space-y-1">
              <div className="text-slate-400 text-[11px] mb-2 font-sans font-bold flex items-center gap-1">
                <Activity size={14} className="text-[#FF5A14]" /> Daemon Diagnostic Metrics
              </div>
              <div>Last Execution: <span className="text-emerald-400">{schedulerStatus?.last_run || 'Pending first cycle'}</span></div>
              <div>Worker Thread: <span className="text-sky-400">VPMSchedulerThread (Daemon=True)</span></div>
              <div>Connectors Monitored: <span className="text-amber-400">Jira, Azure DevOps, SAP ERP S/4HANA, SharePoint M365</span></div>
            </div>
          </div>
        </div>
      ) : (
        /* Connector Form Card */
        <div className="theme-card rounded-2xl overflow-hidden shadow-sm border theme-border">
          <div className="p-6 border-b theme-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl border ${currentProviderDef.bgActive} ${currentProviderDef.color} ${currentProviderDef.borderActive}`}>
                <currentProviderDef.icon size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold theme-heading">{currentProviderDef.name}</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-white/10 theme-heading">
                    Connector
                  </span>
                </div>
                <p className="text-xs theme-muted">{currentProviderDef.desc}</p>
              </div>
            </div>

            {canEdit && (
              <button
                type="button"
                onClick={() => handleLoadDemoPresets(activeTab)}
                disabled={testing}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-purple-500/15 to-indigo-500/15 text-purple-600 dark:text-purple-400 hover:bg-purple-500/25 border border-purple-500/30 rounded-xl text-xs font-bold transition-all"
              >
                <Sparkles size={14} />
                <span>Load Demo Sandbox</span>
              </button>
            )}
          </div>

          <div className="p-6">
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold theme-heading">
                    {currentProviderDef.urlLabel}
                  </label>
                  <input
                    type="text"
                    value={currentSettings.base_url}
                    onChange={(e) => handleFieldChange(activeTab, 'base_url', e.target.value)}
                    placeholder={currentProviderDef.urlPlaceholder}
                    disabled={!canEdit}
                    className="w-full px-4 py-2.5 theme-input rounded-xl text-xs focus:outline-none focus:border-[#FF5A14] disabled:opacity-50 transition-colors"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold theme-heading">
                    {currentProviderDef.userLabel}
                  </label>
                  <input
                    type="text"
                    value={currentSettings.username_email}
                    onChange={(e) => handleFieldChange(activeTab, 'username_email', e.target.value)}
                    placeholder={currentProviderDef.userPlaceholder}
                    disabled={!canEdit}
                    className="w-full px-4 py-2.5 theme-input rounded-xl text-xs focus:outline-none focus:border-[#FF5A14] disabled:opacity-50 transition-colors"
                    required
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-bold theme-heading">
                    {currentProviderDef.tokenLabel}{' '}
                    <span className="theme-muted font-normal text-[11px] ml-1">
                      (Leave blank to keep existing encrypted secret)
                    </span>
                  </label>
                  <input
                    type="password"
                    value={currentSettings.api_token}
                    onChange={(e) => handleFieldChange(activeTab, 'api_token', e.target.value)}
                    placeholder="••••••••••••••••••••••••"
                    disabled={!canEdit}
                    className="w-full px-4 py-2.5 theme-input rounded-xl text-xs focus:outline-none focus:border-[#FF5A14] disabled:opacity-50 transition-colors font-mono"
                  />
                </div>
              </div>

              {/* Test Result Callout */}
              {testResult && (
                <div className={`p-4 rounded-xl border flex items-start gap-3 text-xs ${
                  testResult.success 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                    : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                }`}>
                  {testResult.success ? <CheckCircle2 size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
                  <div>
                    <span className="font-bold">
                      {testResult.success ? 'Handshake Successful' : 'Connection Failed'}:
                    </span>{' '}
                    {testResult.success ? (
                      <span>
                        Verified endpoint at <span className="font-mono">{testResult.server}</span> for user{' '}
                        <span className="font-semibold">{testResult.user}</span>
                        {testResult.is_sandbox && (
                          <span className="ml-2 px-2 py-0.5 bg-purple-500/20 text-purple-700 dark:text-purple-300 font-bold rounded-full text-[10px]">
                            Sandbox Mode ({testResult.latency_ms}ms)
                          </span>
                        )}
                      </span>
                    ) : (
                      <span>{testResult.error}</span>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t theme-border">
                {!canEdit ? (
                  <p className="text-xs text-[#FF5A14] font-medium italic">
                    Read-only mode. Only PMO or Program Directors can update enterprise credentials.
                  </p>
                ) : <div />}
                
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testing}
                    className="flex items-center gap-2 px-4 py-2.5 theme-card rounded-xl text-xs font-bold hover:border-[#FF5A14]/40 disabled:opacity-50 transition-colors"
                  >
                    {testing ? <Loader2 size={15} className="animate-spin" /> : <Activity size={15} />}
                    <span>{testing ? 'Verifying...' : 'Test Connection'}</span>
                  </button>
                  <button
                    type="submit"
                    disabled={!canEdit || saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white rounded-xl text-xs font-bold shadow-md hover:brightness-110 disabled:opacity-50 transition-all"
                  >
                    {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                    <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
