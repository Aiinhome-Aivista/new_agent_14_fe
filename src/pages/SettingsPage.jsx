import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { settingsApi } from '../api/settingsApi';
import { useToast } from '../context/ToastContext';
import { 
  Save, Server, GitBranch, Database, FileText, Bell, 
  Sparkles, CheckCircle2, AlertCircle, Loader2, Activity,
  Unplug, Eye, EyeOff, Key, ExternalLink, Copy,
  FolderKanban, HardDrive, Cloud, Layers, BookmarkCheck
} from 'lucide-react';
import FuturisticLoader from '../components/common/FuturisticLoader';

const PRIMARY_PROVIDERS = [
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
    id: 'google_drive',
    name: 'Google Drive',
    icon: HardDrive,
    color: 'text-emerald-500',
    borderActive: 'border-emerald-500',
    bgActive: 'bg-emerald-500/10',
    desc: 'Google Workspace Shared Drive for MOMs, Charters & SOW Spreadsheets',
    urlLabel: 'Google Drive Folder URL / Shared Drive Link',
    urlPlaceholder: 'https://drive.google.com/drive/folders/YOUR_FOLDER_ID',
    userLabel: 'Google Account / Service Account Email',
    userPlaceholder: 'service-account@project.iam.gserviceaccount.com',
    tokenLabel: 'Google OAuth Token or Service Account Private Key'
  },
  {
    id: 'onedrive',
    name: 'Microsoft OneDrive',
    icon: Cloud,
    color: 'text-blue-400',
    borderActive: 'border-blue-400',
    bgActive: 'bg-blue-400/10',
    desc: 'Microsoft 365 OneDrive Enterprise Cloud Storage & Document Sync',
    urlLabel: 'OneDrive Org URL / Document Library',
    urlPlaceholder: 'https://enterprise-pwc.sharepoint.com/sites/pmo-onedrive',
    userLabel: 'Account Email / Tenant ID',
    userPlaceholder: 'onedrive.pmo@pwc-enterprise.com',
    tokenLabel: 'Microsoft Graph API Client Secret / PAT'
  }
];

const UPCOMING_CONNECTORS = [
  {
    id: 'sap_erp',
    name: 'SAP ERP S/4HANA',
    icon: Database,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/25',
    badge: 'Future Enterprise Release',
    category: 'Cost Centers & Capex Ledger',
    desc: 'Enterprise Cost Centers, General Ledger allocations & automated purchase order payment gates.',
    tags: ['Capex/Opex Feeds', 'PO Gates', 'General Ledger']
  },
  {
    id: 'sharepoint',
    name: 'SharePoint / M365',
    icon: FileText,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/25',
    badge: 'Future Enterprise Release',
    category: 'Document Management',
    desc: 'Steering Committee MOM repositories & Governance Charters with automated version diffs.',
    tags: ['Charters Library', 'M365 Webhooks', 'Meeting Minutes']
  },
  {
    id: 'notifications',
    name: 'Slack & MS Teams',
    icon: Bell,
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/25',
    badge: 'Future Enterprise Release',
    category: 'Escalation Webhooks',
    desc: 'Automated executive broadcasts & threshold breach escalations to PMO leadership channels.',
    tags: ['Critical Alerts', 'Leadership Channels', 'Slack Bot']
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
  const { activeProject } = useProject();
  
  const [activeTab, setActiveTab] = useState('jira');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [seedingAll, setSeedingAll] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showToken, setShowToken] = useState(false);
  const [imgLoadFailed, setImgLoadFailed] = useState(false);
  const [notifiedConnectors, setNotifiedConnectors] = useState({});

  // Track connected status from database per provider
  const [connectedProviders, setConnectedProviders] = useState({
    jira: false,
    azure_devops: false,
    google_drive: false,
    onedrive: false
  });

  // Track whether provider has an existing saved token in DB
  const [tokenStatus, setTokenStatus] = useState({
    jira: false,
    azure_devops: false,
    google_drive: false,
    onedrive: false
  });

  // Detailed profile information for connected accounts
  const [connectedProfiles, setConnectedProfiles] = useState({
    jira: null,
    azure_devops: null,
    google_drive: null,
    onedrive: null
  });

  // Settings stored per provider
  const [allSettings, setAllSettings] = useState({
    jira: { base_url: '', username_email: '', api_token: '' },
    azure_devops: { base_url: '', username_email: '', api_token: '' },
    google_drive: { base_url: '', username_email: '', api_token: '' },
    onedrive: { base_url: '', username_email: '', api_token: '' }
  });

  const canEdit = ['PMO', 'Program Director'].includes(user?.role);

  const loadAll = async (projectId = activeProject?.id) => {
    try {
      setLoading(true);
      const res = await settingsApi.getAllSettings(projectId);
      const items = res.settings || (res.data ? Object.values(res.data) : []);
      
      const updatedSettings = {
        jira: { base_url: '', username_email: '', api_token: '' },
        azure_devops: { base_url: '', username_email: '', api_token: '' },
        google_drive: { base_url: '', username_email: '', api_token: '' },
        onedrive: { base_url: '', username_email: '', api_token: '' }
      };
      const updatedConnected = {
        jira: false,
        azure_devops: false,
        google_drive: false,
        onedrive: false
      };
      const updatedTokens = {
        jira: false,
        azure_devops: false,
        google_drive: false,
        onedrive: false
      };
      const updatedProfiles = {
        jira: null,
        azure_devops: null,
        google_drive: null,
        onedrive: null
      };

      if (items && items.length > 0) {
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
              let accType = 'Enterprise Service Account';
              if (item.provider === 'jira') accType = 'Atlassian Cloud Identity';
              else if (item.provider === 'azure_devops') accType = 'Azure DevOps Organization Account';
              else if (item.provider === 'google_drive') accType = 'Google Workspace Cloud Drive';
              else if (item.provider === 'onedrive') accType = 'Microsoft 365 Tenant Account';

              updatedProfiles[item.provider] = {
                user: item.username_email.split('@')[0],
                email: item.username_email,
                server: item.base_url,
                account_type: accType
              };
            }
          }
        });
      }

      setAllSettings(updatedSettings);
      setConnectedProviders(updatedConnected);
      setTokenStatus(updatedTokens);
      setConnectedProfiles(updatedProfiles);

      // If Jira is connected, fetch live Atlassian user profile in background
      const jiraSetting = items.find(s => s.provider === 'jira' && s.is_connected);
      if (jiraSetting && jiraSetting.base_url && jiraSetting.username_email) {
        settingsApi.testProviderConnection('jira', projectId).then(jRes => {
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
    } catch (err) {
      console.error("Failed to load settings:", err);
      showToast("Failed to load enterprise settings.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll(activeProject?.id);
  }, [activeProject?.id]);

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
    if (!canEdit) return;
    
    try {
      setSaving(true);
      setTestResult(null);
      const current = allSettings[activeTab];
      const res = await settingsApi.saveProviderSettings(activeTab, current, activeProject?.id);
      
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

      let accType = 'Enterprise Service Account';
      if (activeTab === 'jira') accType = 'Atlassian Cloud Identity';
      else if (activeTab === 'azure_devops') accType = 'Azure DevOps Organization Account';
      else if (activeTab === 'google_drive') accType = 'Google Workspace Cloud Drive';
      else if (activeTab === 'onedrive') accType = 'Microsoft 365 Tenant Account';

      setConnectedProfiles(prev => ({
        ...prev,
        [activeTab]: {
          user: tRes.user || current.username_email?.split('@')[0] || 'Enterprise User',
          email: tRes.email || current.username_email,
          server: tRes.server || current.base_url,
          avatar_url: tRes.avatar_url || '',
          account_type: tRes.account_type || accType,
          time_zone: tRes.time_zone || ''
        }
      }));

      showToast(res.message || `${PRIMARY_PROVIDERS.find(p => p.id === activeTab)?.name} saved and connected for Project!`, "success");
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
    try {
      setTesting(true);
      setTestResult(null);
      const current = allSettings[activeTab];
      const result = await settingsApi.testProviderConnection(activeTab, activeProject?.id, current);
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

        let accType = 'Enterprise Service Account';
        if (activeTab === 'jira') accType = 'Atlassian Cloud Identity';
        else if (activeTab === 'azure_devops') accType = 'Azure DevOps Organization Account';
        else if (activeTab === 'google_drive') accType = 'Google Workspace Cloud Drive';
        else if (activeTab === 'onedrive') accType = 'Microsoft 365 Tenant Account';

        setConnectedProfiles(prev => ({
          ...prev,
          [activeTab]: {
            user: result.user || allSettings[activeTab].username_email?.split('@')[0],
            email: result.email || allSettings[activeTab].username_email,
            server: result.server || allSettings[activeTab].base_url,
            avatar_url: result.avatar_url,
            account_type: result.account_type || accType,
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
    if (!canEdit) return;
    try {
      setDisconnecting(true);
      const res = await settingsApi.disconnectProvider(provider, activeProject?.id);
      setConnectedProviders(prev => ({
        ...prev,
        [provider]: false
      }));
      setConnectedProfiles(prev => ({
        ...prev,
        [provider]: null
      }));
      setTestResult(null);
      showToast(res.message || `${PRIMARY_PROVIDERS.find(p => p.id === provider)?.name} disconnected.`, "info");
    } catch (err) {
      console.error("Failed to disconnect:", err);
      showToast(`Failed to disconnect ${provider}.`, "error");
    } finally {
      setDisconnecting(false);
    }
  };

  const handleLoadDemoPresets = async (targetProvider = null) => {
    try {
      setTestResult(null);
      if (targetProvider) {
        setTesting(true);
      } else {
        setSeedingAll(true);
      }
      const res = await settingsApi.loadDemoPresets(targetProvider, activeProject?.id);
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
            if (next[p] !== undefined) next[p] = true;
          });
          return next;
        });
        setTokenStatus(prev => {
          const next = { ...prev };
          Object.keys(res.data).forEach(p => {
            if (next[p] !== undefined) next[p] = true;
          });
          return next;
        });
        setConnectedProfiles(prev => {
          const next = { ...prev };
          Object.keys(res.data).forEach(p => {
            if (next[p] !== undefined) {
              next[p] = {
                user: res.data[p].username_email?.split('@')[0],
                email: res.data[p].username_email,
                server: res.data[p].base_url,
                account_type: p === 'jira' ? 'Atlassian Verified Sandbox' : 'Enterprise Demo Sandbox'
              };
            }
          });
          return next;
        });
        showToast(res.message || `Demo credentials loaded for Project ${activeProject?.jira_key || ''}!`, "success");
      }
    } catch (err) {
      console.error("Failed to load demo presets:", err);
      showToast("Failed to load demo sandbox credentials.", "error");
    } finally {
      setTesting(false);
      setSeedingAll(false);
    }
  };

  const handleToggleNotify = (connId, connName) => {
    setNotifiedConnectors(prev => {
      const nextState = !prev[connId];
      if (nextState) {
        showToast(`You will be notified when ${connName} is available for Project [${activeProject?.jira_key || 'PRJ'}]!`, 'success');
      }
      return { ...prev, [connId]: nextState };
    });
  };

  if (loading) {
    return (
      <FuturisticLoader 
        title="Loading Enterprise Connectors..." 
        subtitle="Verifying encrypted credentials and project isolation bounds"
      />
    );
  }

  const currentProviderDef = PRIMARY_PROVIDERS.find(p => p.id === activeTab) || PRIMARY_PROVIDERS[0];
  const currentSettings = allSettings[activeTab] || { base_url: '', username_email: '', api_token: '' };

  return (
    <div className="py-2 w-full space-y-6">
      {/* Header with Global 1-Click Sandbox Seeder */}
      <div className="pb-4 border-b theme-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black theme-heading tracking-tight">Enterprise Connectors Hub</h1>
          <p className="text-xs sm:text-sm theme-muted mt-1">
            Configure live operational connector connections (Jira, Azure DevOps, Google Drive, OneDrive) saved per project in database.
          </p>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={() => handleLoadDemoPresets(null)}
            disabled={seedingAll}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {seedingAll ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            <span>1-Click Seed Project Demo Sandboxes</span>
          </button>
        )}
      </div>

      {/* Active Project Connector Context Banner */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#131A29] border border-[#FF5A14]/30 flex items-center justify-between gap-4 shadow-sm dark:shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FF5A14]/15 text-[#FF5A14] flex items-center justify-center font-bold flex-shrink-0">
            <FolderKanban size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-[#FF5A14]/15 text-[#FF7A45] border border-[#FF5A14]/30">
                Active Project Context: {activeProject?.jira_key || 'PRJ'} (ID: #{activeProject?.id || 1})
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">DB & Scoped per Project</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
              {activeProject?.name || 'Enterprise Project'}
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Manage connector credentials and authentication for this project. All credentials and connection states are stored securely per project in MySQL.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Primary Connectors & Right Upcoming Integrations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Workbench: Jira, Azure DevOps, Google Drive, OneDrive (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Primary Connector Tabs (4 project connectors: Jira, Azure, GDrive, OneDrive) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pb-2">
            {PRIMARY_PROVIDERS.map((prov) => {
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
                  className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-[#FF5A14] text-white shadow-lg shadow-[#FF5A14]/25 scale-[1.01]' 
                      : 'theme-subtle hover:theme-subtle-hover theme-heading border theme-border'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Icon size={17} className={isActive ? 'text-white' : prov.color} />
                    <span className="truncate">{prov.name}</span>
                  </div>
                  <span 
                    title={isConnected ? `${prov.name} is Connected to Project #${activeProject?.id}` : `${prov.name} is Disconnected`}
                    className={`w-2.5 h-2.5 rounded-full shrink-0 transition-all ${
                      isConnected 
                        ? (isActive ? 'bg-emerald-300 ring-4 ring-white/30 animate-pulse' : 'bg-emerald-400 ring-4 ring-emerald-400/30 animate-pulse') 
                        : (isActive ? 'bg-white/30' : 'bg-slate-400/30')
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Connector Form Card (Jira, Azure DevOps, Google Drive, or OneDrive) */}
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
                        Connected to Project #{activeProject?.id || 1}
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

              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                {canEdit && connectedProviders[activeTab] && (
                  <button
                    type="button"
                    onClick={() => handleDisconnect(activeTab)}
                    disabled={disconnecting}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                    title="Disconnect account manually for this project"
                  >
                    {disconnecting ? <Loader2 size={14} className="animate-spin" /> : <Unplug size={14} />}
                    <span>Disconnect</span>
                  </button>
                )}

                {canEdit && activeTab !== 'google_drive' && (
                  <button
                    type="button"
                    onClick={() => handleLoadDemoPresets(activeTab)}
                    disabled={testing}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-purple-500/15 to-indigo-500/15 text-purple-600 dark:text-purple-400 hover:bg-purple-500/25 border border-purple-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    title="Seed demo credentials into database for this project"
                  >
                    <Sparkles size={14} />
                    <span>Load Demo Sandbox</span>
                  </button>
                )}
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Connected Identity HUD */}
              {connectedProviders[activeTab] && (
                <div className="relative rounded-2xl overflow-hidden border border-emerald-500/30 dark:border-emerald-500/40 bg-gradient-to-b from-emerald-500/[0.07] via-slate-50/90 to-white dark:from-[#101726]/95 dark:via-[#0D1322]/90 dark:to-[#0A0E1A]/95 shadow-sm dark:shadow-[0_10px_35px_rgba(0,0,0,0.5)] backdrop-blur-xl">
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse" />
                  
                  {/* Top HUD Telemetry Bar */}
                  <div className="px-5 py-2.5 bg-emerald-500/[0.08] dark:bg-white/[0.03] border-b border-emerald-500/20 dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                        LIVE PROJECT CONNECTOR CONNECTION
                      </span>
                      <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">|</span>
                      <span className="font-mono text-slate-500 dark:text-slate-400 hidden sm:inline">
                        SCOPED TO PROJECT [{activeProject?.jira_key || 'PRJ'}]
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                        TLS 1.3 ENCRYPTED
                      </span>
                    </div>
                  </div>

                  {/* Main Identity Information Block */}
                  <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
                    <div className="flex items-start sm:items-center gap-4.5">
                      <div className="relative shrink-0">
                        {connectedProfiles[activeTab]?.avatar_url && !imgLoadFailed ? (
                          <img 
                            src={connectedProfiles[activeTab].avatar_url} 
                            alt={connectedProfiles[activeTab]?.user || 'Account Avatar'} 
                            onError={() => setImgLoadFailed(true)}
                            className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-400/80 shadow-[0_0_20px_rgba(16,185,129,0.25)] ring-4 ring-emerald-500/20"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF5A14] via-purple-600 to-emerald-400 p-[1.5px] shadow-[0_0_20px_rgba(255,90,20,0.25)]">
                            <div className="w-full h-full rounded-[13px] bg-emerald-50/90 dark:bg-[#0C111E] flex flex-col items-center justify-center">
                              <span className="text-lg font-black tracking-wider text-emerald-950 dark:text-emerald-300">
                                {getInitials(connectedProfiles[activeTab]?.user, currentSettings.username_email)}
                              </span>
                            </div>
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-md ring-2 ring-white dark:ring-slate-900">
                          <CheckCircle2 size={10} strokeWidth={3} className="text-white dark:text-slate-950" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                            {connectedProfiles[activeTab]?.user || currentSettings.username_email || 'Enterprise Verified Account'}
                          </h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40">
                            Verified {currentProviderDef.name}
                          </span>
                        </div>

                        <div className="text-xs text-slate-700 dark:text-slate-300 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 font-medium">Account / ID:</span>
                            <span className="font-mono text-emerald-700 dark:text-emerald-300 font-bold">
                              {connectedProfiles[activeTab]?.email || currentSettings.username_email}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 font-medium">Host / Drive:</span>
                            <a 
                              href={currentSettings.base_url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="font-mono text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 font-semibold truncate max-w-xs"
                            >
                              <span className="truncate">{currentSettings.base_url}</span>
                              <ExternalLink size={10} className="shrink-0" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-mono text-slate-500 block tracking-wider">Project Telemetry</span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 justify-end">
                        <Activity size={13} className="animate-pulse" /> Linked to #{activeProject?.id || 1}
                      </span>
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
                          Token Saved in DB for Project #{activeProject?.id || 1}
                        </span>
                      ) : (
                        <span className="text-[11px] theme-muted font-normal">
                          (Enter secret/token to authenticate)
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
                            className="p-1.5 text-slate-400 hover:text-[#FF5A14] rounded-md transition-colors cursor-pointer"
                            title="Copy token to clipboard"
                          >
                            <Copy size={15} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowToken(!showToken)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-md transition-colors cursor-pointer"
                          title={showToken ? "Hide secret token" : "Show secret token"}
                        >
                          {showToken ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] theme-muted">
                      {tokenStatus[activeTab] && !currentSettings.api_token
                        ? `A secure encrypted token is active in DB for Project [${activeProject?.jira_key || ''}]. Leave blank to keep existing token.`
                        : "Click the eye icon to view or verify the token before saving."}
                    </p>
                    {activeTab === 'google_drive' && (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400/90 font-medium bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
                        <strong>Live Connector:</strong> Supports either a <strong>Google Service Account Private Key</strong> (<code className="font-mono bg-emerald-500/20 px-1 py-0.5 rounded">-----BEGIN PRIVATE KEY-----</code>) with its Service Account Email, or an <strong>OAuth 2.0 Bearer Token</strong> (<code className="font-mono bg-emerald-500/20 px-1 py-0.5 rounded">ya29.</code>). Invalid or mismatched keys will be strictly rejected.
                      </p>
                    )}
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
                              Sandbox Mode
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
                      <span>Connection active for Project [{activeProject?.jira_key || 'PRJ'}]. Stored securely in database.</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs theme-muted">
                      <span>Credentials will be saved exclusively for Project [{activeProject?.jira_key || 'PRJ'}].</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3">
                    {canEdit && connectedProviders[activeTab] && (
                      <button
                        type="button"
                        onClick={() => handleDisconnect(activeTab)}
                        disabled={disconnecting}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {disconnecting ? <Loader2 size={15} className="animate-spin" /> : <Unplug size={15} />}
                        <span>Disconnect</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={testing}
                      className="flex items-center gap-2 px-4 py-2.5 theme-card rounded-xl text-xs font-bold hover:border-[#FF5A14]/40 disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      {testing ? <Loader2 size={15} className="animate-spin" /> : <Activity size={15} />}
                      <span>{testing ? 'Verifying...' : 'Test Connection'}</span>
                    </button>
                    <button
                      type="submit"
                      disabled={!canEdit || saving}
                      className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white rounded-xl text-xs font-bold shadow-md hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                      <span>{saving ? 'Saving...' : 'Save for Project'}</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Right Side Panel: Upcoming Integrations (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="theme-card rounded-2xl p-5 border theme-border shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b theme-border mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500 border border-purple-500/20">
                  <Layers size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold theme-heading">Upcoming Integrations</h3>
                  <p className="text-[11px] theme-muted">Scheduled for future enterprise updates</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                Roadmap
              </span>
            </div>

            <p className="text-xs theme-muted mb-4 leading-relaxed">
              <strong>Jira</strong>, <strong>Azure DevOps</strong>, <strong>Google Drive</strong>, and <strong>OneDrive</strong> are active connectors configured project-wise. The remaining tools below are on the platform roadmap:
            </p>

            {/* Upcoming Connectors List */}
            <div className="space-y-3">
              {UPCOMING_CONNECTORS.map((conn) => {
                const Icon = conn.icon;
                const isNotified = notifiedConnectors[conn.id];
                return (
                  <div 
                    key={conn.id}
                    className="p-3.5 rounded-xl theme-subtle border theme-border hover:border-slate-500/40 transition-all space-y-2 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-lg ${conn.bgColor} ${conn.color} ${conn.borderColor} border shrink-0`}>
                          <Icon size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold theme-heading">{conn.name}</h4>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/20">
                              {conn.badge}
                            </span>
                          </div>
                          <span className="text-[10px] theme-muted font-medium block">{conn.category}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] theme-muted leading-relaxed">
                      {conn.desc}
                    </p>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {conn.tags.map((tag, idx) => (
                        <span 
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[9px] font-mono theme-subtle border theme-border theme-muted"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t theme-border text-[11px]">
                      <span className="text-[10px] theme-muted italic">Future availability</span>
                      <button
                        type="button"
                        onClick={() => handleToggleNotify(conn.id, conn.name)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          isNotified 
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                            : 'theme-subtle hover:bg-[#FF5A14]/15 hover:text-[#FF7A45] theme-heading border theme-border'
                        }`}
                      >
                        {isNotified ? (
                          <>
                            <BookmarkCheck size={12} className="text-emerald-400" />
                            <span>Subscribed</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={11} className="text-[#FF5A14]" />
                            <span>Notify on Release</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom info note */}
            <div className="mt-4 p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 text-[11px] theme-muted flex items-start gap-2">
              <Sparkles size={15} className="text-purple-400 shrink-0 mt-0.5" />
              <span>
                Want documents analyzed immediately? You can upload local SOWs or MOM files (.docx, .pdf, .xlsx) via the <strong className="theme-heading">Document Ingestion</strong> module.
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SettingsPage;
