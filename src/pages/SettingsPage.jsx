import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { settingsApi } from '../api/settingsApi';
import { useToast } from '../context/ToastContext';
import { 
  Save, Server, GitBranch, Database, FileText, Bell, Clock, 
  Sparkles, CheckCircle2, AlertCircle, Loader2, Activity, RefreshCw,
  Unplug, Wifi, WifiOff, Eye, EyeOff, Key, ExternalLink, UserCheck, Copy 
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

const getInitials = (name, email) => {
  if (name && typeof name === 'string' && name.trim()) {
    const clean = name.trim();
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  }
  if (email && typeof email === 'string' && email.trim()) {
    const user = email.split('@')[0];
    return user.slice(0, 2).toUpperCase();
  }
  return 'ID';
};

const SettingsPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState('jira');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [seedingAll, setSeedingAll] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showToken, setShowToken] = useState(false);
  const [imgLoadFailed, setImgLoadFailed] = useState(false);

  // Track connected status from database per provider
  const [connectedProviders, setConnectedProviders] = useState({
    jira: false,
    azure_devops: false,
    sap_erp: false,
    sharepoint: false,
    notifications: false
  });

  // Track whether provider has an existing saved token in DB
  const [tokenStatus, setTokenStatus] = useState({
    jira: false,
    azure_devops: false,
    sap_erp: false,
    sharepoint: false,
    notifications: false
  });

  // Detailed profile information for connected accounts
  const [connectedProfiles, setConnectedProfiles] = useState({
    jira: null,
    azure_devops: null,
    sap_erp: null,
    sharepoint: null,
    notifications: null
  });

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
      const items = res.settings || (res.data ? Object.values(res.data) : []);
      if (items && items.length > 0) {
        const updatedSettings = { ...allSettings };
        const updatedConnected = { ...connectedProviders };
        const updatedTokens = { ...tokenStatus };
        const updatedProfiles = { ...connectedProfiles };

        items.forEach(item => {
          if (item && item.provider && updatedSettings[item.provider] !== undefined) {
            updatedSettings[item.provider] = {
              base_url: item.base_url || '',
              username_email: item.username_email || '',
              api_token: item.api_token || ''
            };
            updatedConnected[item.provider] = Boolean(item.is_connected);
            updatedTokens[item.provider] = Boolean(item.has_token);

            if (item.is_connected && item.username_email) {
              updatedProfiles[item.provider] = {
                user: item.username_email.split('@')[0],
                email: item.username_email,
                server: item.base_url,
                account_type: item.provider === 'jira' ? 'Atlassian Cloud Identity' : 'Enterprise Service Account'
              };
            }
          }
        });

        setAllSettings(updatedSettings);
        setConnectedProviders(updatedConnected);
        setTokenStatus(updatedTokens);
        setConnectedProfiles(updatedProfiles);

        // If Jira is connected, fetch live Atlassian user profile (display name, avatar) in background
        const jiraSetting = items.find(s => s.provider === 'jira' && s.is_connected);
        if (jiraSetting && jiraSetting.base_url && jiraSetting.username_email) {
          settingsApi.testProviderConnection('jira').then(jRes => {
            if (jRes && jRes.success) {
              setConnectedProfiles(prev => ({
                ...prev,
                jira: {
                  user: jRes.user || prev.jira?.user,
                  email: jRes.email || prev.jira?.email || jiraSetting.username_email,
                  server: jRes.server || prev.jira?.server || jiraSetting.base_url,
                  avatar_url: jRes.avatar_url || '',
                  account_type: jRes.account_type || 'Atlassian Cloud Identity',
                  time_zone: jRes.time_zone || ''
                }
              }));
            }
          }).catch(() => {});
        }
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
    setTestResult(null);
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
      setTestResult(null);
      const current = allSettings[activeTab];
      const res = await settingsApi.saveProviderSettings(activeTab, current);
      
      const tRes = res.test_result || {};
      setTestResult(tRes);

      setConnectedProviders(prev => ({
        ...prev,
        [activeTab]: true
      }));
      setTokenStatus(prev => ({
        ...prev,
        [activeTab]: Boolean(current.api_token || prev[activeTab])
      }));
      setConnectedProfiles(prev => ({
        ...prev,
        [activeTab]: {
          user: tRes.user || current.username_email?.split('@')[0] || 'Enterprise User',
          email: tRes.email || current.username_email,
          server: tRes.server || current.base_url,
          avatar_url: tRes.avatar_url || '',
          account_type: tRes.account_type || (activeTab === 'jira' ? 'Atlassian Cloud Identity' : 'Enterprise Service Account'),
          time_zone: tRes.time_zone || ''
        }
      }));

      showToast(res.message || `${PROVIDERS.find(p => p.id === activeTab)?.name} verified and connected successfully!`, "success");
      // Keep active token in state so user can view/copy it via eye toggle
      setAllSettings(prev => ({
        ...prev,
        [activeTab]: { 
          ...prev[activeTab], 
          api_token: current.api_token || prev[activeTab].api_token || '' 
        }
      }));
    } catch (err) {
      console.error("Failed to save settings:", err);
      const errMsg = err.response?.data?.error || err.message || `Failed to verify and save ${activeTab} configuration.`;
      const failedResult = err.response?.data?.test_result || { success: false, error: errMsg };
      setTestResult(failedResult);
      setConnectedProviders(prev => ({
        ...prev,
        [activeTab]: false
      }));
      setConnectedProfiles(prev => ({
        ...prev,
        [activeTab]: null
      }));
      showToast(errMsg, "error");
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
        setConnectedProviders(prev => ({
          ...prev,
          [activeTab]: true
        }));
        setTokenStatus(prev => ({
          ...prev,
          [activeTab]: true
        }));
        setConnectedProfiles(prev => ({
          ...prev,
          [activeTab]: {
            user: result.user || allSettings[activeTab].username_email?.split('@')[0],
            email: result.email || allSettings[activeTab].username_email,
            server: result.server || allSettings[activeTab].base_url,
            avatar_url: result.avatar_url,
            account_type: result.account_type || (activeTab === 'jira' ? 'Atlassian Cloud Identity' : 'Enterprise Service Account'),
            time_zone: result.time_zone
          }
        }));
        showToast(`Connected successfully! Authenticated as: ${result.user || 'OK'}`, "success");
      } else {
        setConnectedProviders(prev => ({
          ...prev,
          [activeTab]: false
        }));
        setConnectedProfiles(prev => ({
          ...prev,
          [activeTab]: null
        }));
        showToast(`Connection failed: ${result.error || 'Authentication rejected.'}`, "error");
      }
    } catch (err) {
      console.error("Test connection failed:", err);
      const errMsg = err.response?.data?.error || err.message || "Failed to test connection.";
      setTestResult({ success: false, error: errMsg });
      setConnectedProviders(prev => ({
        ...prev,
        [activeTab]: false
      }));
      setConnectedProfiles(prev => ({
        ...prev,
        [activeTab]: null
      }));
      showToast(errMsg, "error");
    } finally {
      setTesting(false);
    }
  };

  const handleDisconnect = async (provider = activeTab) => {
    if (!canEdit || provider === 'scheduler') return;
    try {
      setDisconnecting(true);
      const res = await settingsApi.disconnectProvider(provider);
      setConnectedProviders(prev => ({
        ...prev,
        [provider]: false
      }));
      setConnectedProfiles(prev => ({
        ...prev,
        [provider]: null
      }));
      setTestResult(null);
      showToast(res.message || `${PROVIDERS.find(p => p.id === provider)?.name} disconnected.`, "info");
    } catch (err) {
      console.error("Failed to disconnect:", err);
      showToast(`Failed to disconnect ${provider}.`, "error");
    } finally {
      setDisconnecting(false);
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
        setConnectedProviders(prev => {
          const next = { ...prev };
          Object.keys(res.data).forEach(p => {
            next[p] = true;
          });
          return next;
        });
        setTokenStatus(prev => {
          const next = { ...prev };
          Object.keys(res.data).forEach(p => {
            next[p] = true;
          });
          return next;
        });
        setConnectedProfiles(prev => {
          const next = { ...prev };
          Object.keys(res.data).forEach(p => {
            next[p] = {
              user: res.data[p].username_email?.split('@')[0],
              email: res.data[p].username_email,
              server: res.data[p].base_url,
              account_type: p === 'jira' ? 'Atlassian Verified Sandbox' : 'Enterprise Demo Sandbox'
            };
          });
          return next;
        });
        showToast(res.message || "Demo sandbox credentials loaded and connected!", "success");
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
    <div className="py-2 w-full space-y-6">
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
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5 pb-3 border-b theme-border">
        {PROVIDERS.map((prov) => {
          const Icon = prov.icon;
          const isActive = activeTab === prov.id;
          const isConnected = connectedProviders[prov.id];
          return (
            <button
              key={prov.id}
              onClick={() => {
                setActiveTab(prov.id);
                setTestResult(null);
                setShowToken(false);
                setImgLoadFailed(false);
              }}
              className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                isActive 
                  ? 'bg-[#FF5A14] text-white shadow-lg shadow-[#FF5A14]/25 scale-[1.01]' 
                  : 'theme-subtle hover:theme-subtle-hover theme-heading border theme-border'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon size={17} className={isActive ? 'text-white' : prov.color} />
                <span className="truncate">{prov.name}</span>
              </div>
              {prov.id !== 'scheduler' && (
                <span 
                  title={isConnected ? `${prov.name} is Connected` : `${prov.name} is Disconnected`}
                  className={`w-2.5 h-2.5 rounded-full shrink-0 transition-all ${
                    isConnected 
                      ? (isActive ? 'bg-emerald-300 ring-4 ring-white/30 animate-pulse' : 'bg-emerald-400 ring-4 ring-emerald-400/30 animate-pulse') 
                      : (isActive ? 'bg-white/30' : 'bg-slate-400/30')
                  }`}
                />
              )}
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
                  {connectedProviders[activeTab] ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                      Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />
                      Disconnected
                    </span>
                  )}
                </div>
                <p className="text-xs theme-muted">{currentProviderDef.desc}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {canEdit && connectedProviders[activeTab] && (
                <button
                  type="button"
                  onClick={() => handleDisconnect(activeTab)}
                  disabled={disconnecting}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                  title="Disconnect account manually"
                >
                  {disconnecting ? <Loader2 size={14} className="animate-spin" /> : <Unplug size={14} />}
                  <span>Disconnect Account</span>
                </button>
              )}

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
          </div>

          <div className="p-6 space-y-6">
            {/* Futuristic Connected Identity HUD (Dual Light & Dark Theme Adaptive) */}
            {connectedProviders[activeTab] && (
              <div className="relative rounded-2xl overflow-hidden border border-emerald-500/30 dark:border-emerald-500/40 bg-gradient-to-b from-emerald-500/[0.07] via-slate-50/90 to-white dark:from-[#101726]/95 dark:via-[#0D1322]/90 dark:to-[#0A0E1A]/95 shadow-sm dark:shadow-[0_10px_35px_rgba(0,0,0,0.5)] backdrop-blur-xl">
                {/* Ambient glow accent line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse" />
                <div className="absolute -right-16 -top-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -left-16 -bottom-16 w-56 h-56 bg-[#FF5A14]/10 rounded-full blur-3xl pointer-events-none" />

                {/* Top HUD Telemetry Bar */}
                <div className="px-5 py-2.5 bg-emerald-500/[0.08] dark:bg-white/[0.03] border-b border-emerald-500/20 dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                      LIVE ENTERPRISE CONNECTOR PIPELINE
                    </span>
                    <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">|</span>
                    <span className="font-mono text-slate-500 dark:text-slate-400 hidden sm:inline">
                      {currentProviderDef.name.toUpperCase()} REST API PROTOCOL
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                      TLS 1.3 ENCRYPTED
                    </span>
                    <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 hidden md:inline">
                      STATUS: VERIFIED
                    </span>
                  </div>
                </div>

                {/* Main Identity Information Block */}
                <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                  <div className="flex items-start sm:items-center gap-4.5">
                    {/* Futuristic Monogram Cyber Avatar */}
                    <div className="relative shrink-0">
                      {connectedProfiles[activeTab]?.avatar_url && !imgLoadFailed ? (
                        <img 
                          src={connectedProfiles[activeTab].avatar_url} 
                          alt={connectedProfiles[activeTab]?.user || 'Account Avatar'} 
                          onError={() => setImgLoadFailed(true)}
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-400/80 shadow-[0_0_20px_rgba(16,185,129,0.25)] ring-4 ring-emerald-500/20"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF5A14] via-purple-600 to-emerald-400 p-[1.5px] shadow-[0_0_25px_rgba(255,90,20,0.25)]">
                          <div className="w-full h-full rounded-[14px] bg-emerald-50/90 dark:bg-[#0C111E] flex flex-col items-center justify-center border border-emerald-200/50 dark:border-transparent">
                            <span className="text-xl font-black tracking-wider text-emerald-950 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-br dark:from-white dark:via-slate-100 dark:to-emerald-300">
                              {getInitials(connectedProfiles[activeTab]?.user, currentSettings.username_email)}
                            </span>
                            <span className="text-[8px] font-mono text-emerald-700 dark:text-emerald-400 uppercase tracking-widest -mt-0.5">
                              SEC-ID
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-md ring-2 ring-white dark:ring-slate-900" title="Active Verified Account">
                        <CheckCircle2 size={12} strokeWidth={3} className="text-white dark:text-slate-950" />
                      </div>
                    </div>

                    {/* Identity Details */}
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                          {connectedProfiles[activeTab]?.user || currentSettings.username_email || 'Enterprise Verified Account'}
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                          <Sparkles size={10} /> Verified {currentProviderDef.name} Account
                        </span>
                        {connectedProfiles[activeTab]?.time_zone && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-200/80 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border border-slate-300/80 dark:border-slate-700/80">
                            {connectedProfiles[activeTab].time_zone}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Account ID / Email:</span>
                          <span className="font-mono text-emerald-700 dark:text-emerald-300 font-bold">
                            {connectedProfiles[activeTab]?.email || currentSettings.username_email}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Host / Instance:</span>
                          <a 
                            href={currentSettings.base_url} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="font-mono text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 hover:underline flex items-center gap-1 font-semibold"
                          >
                            <span>{currentSettings.base_url}</span>
                            <ExternalLink size={11} />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action and Telemetry Column */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-200 dark:border-white/10 shrink-0">
                    <div className="text-right hidden sm:block">
                      <span className="text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400 block tracking-wider">Sync Pipeline</span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 justify-end">
                        <Activity size={13} className="animate-pulse" /> Continuous Bi-Directional
                      </span>
                    </div>

                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleDisconnect(activeTab)}
                        disabled={disconnecting}
                        className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 dark:bg-rose-500/15 dark:hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 border border-rose-500/30 hover:border-rose-500/50 rounded-xl text-xs font-bold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                      >
                        {disconnecting ? <Loader2 size={14} className="animate-spin" /> : <Unplug size={14} />}
                        <span>Disconnect Account</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

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
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold theme-heading flex items-center gap-1.5">
                      <Key size={13} className="text-[#FF5A14]" />
                      <span>{currentProviderDef.tokenLabel}</span>
                    </label>
                    
                    {tokenStatus[activeTab] ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 size={11} />
                        Token Saved & Active
                      </span>
                    ) : (
                      <span className="text-[11px] theme-muted font-normal">
                        (Enter token to authenticate)
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type={showToken ? "text" : "password"}
                      value={currentSettings.api_token}
                      onChange={(e) => handleFieldChange(activeTab, 'api_token', e.target.value)}
                      placeholder={
                        tokenStatus[activeTab] 
                          ? "•••••••••••••••••••••••• (Encrypted Secret Configured - Type to change)" 
                          : "Paste API token / Secret key here"
                      }
                      disabled={!canEdit}
                      className="w-full pl-4 pr-20 py-2.5 theme-input rounded-xl text-xs focus:outline-none focus:border-[#FF5A14] disabled:opacity-50 transition-colors font-mono"
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {currentSettings.api_token && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(currentSettings.api_token);
                            showToast("Token copied to clipboard!", "success");
                          }}
                          className="p-1.5 text-slate-400 hover:text-[#FF5A14] rounded-md transition-colors"
                          title="Copy token to clipboard"
                        >
                          <Copy size={15} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-md transition-colors"
                        title={showToken ? "Hide secret token" : "Show secret token"}
                      >
                        {showToken ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] theme-muted">
                    {tokenStatus[activeTab] && !currentSettings.api_token
                      ? "A secure encrypted token is currently active. Leave this field blank to keep the existing token, or enter a new token to update it."
                      : "Click the eye icon to view or verify the token before saving."}
                  </p>
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
                ) : connectedProviders[activeTab] ? (
                  <div className="flex items-center gap-2 text-xs text-emerald-500 font-medium">
                    <CheckCircle2 size={15} />
                    <span>Account is connected. Status persists across reloads until manually disconnected.</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs theme-muted">
                    <span>Enter credentials and click "Save Configuration" or "Test Connection" to connect.</span>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  {canEdit && connectedProviders[activeTab] && (
                    <button
                      type="button"
                      onClick={() => handleDisconnect(activeTab)}
                      disabled={disconnecting}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 transition-colors disabled:opacity-50"
                    >
                      {disconnecting ? <Loader2 size={15} className="animate-spin" /> : <Unplug size={15} />}
                      <span>Disconnect</span>
                    </button>
                  )}
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
