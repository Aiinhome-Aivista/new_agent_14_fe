import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { settingsApi } from '../api/settingsApi';
import { useToast } from '../context/ToastContext';
import { Save, Server, Loader2, Activity } from 'lucide-react';
import FuturisticLoader from '../components/common/FuturisticLoader';

const SettingsPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [settings, setSettings] = useState({
    base_url: '',
    username_email: '',
    api_token: ''
  });

  const canEdit = ['PMO', 'Program Director'].includes(user?.role);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await settingsApi.getJiraSettings();
        setSettings({
          base_url: data.base_url || '',
          username_email: data.username_email || '',
          api_token: ''
        });
      } catch (err) {
        console.error("Failed to load settings:", err);
        showToast("Failed to load Jira settings.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [showToast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canEdit) return;
    
    try {
      setSaving(true);
      await settingsApi.saveJiraSettings(settings);
      showToast("Jira configuration saved successfully!", "success");
      setSettings(prev => ({ ...prev, api_token: '' }));
    } catch (err) {
      console.error("Failed to save settings:", err);
      showToast("Failed to save Jira configuration.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      const result = await settingsApi.testJiraConnection();
      if (result.success) {
        showToast(`Connected successfully! Server: ${result.server || 'OK'}, User: ${result.user || 'Authorized'}`, "success");
      } else {
        showToast(`Connection test failed: ${result.error || 'Unknown error'}`, "error");
      }
    } catch (err) {
      console.error("Jira test connection failed:", err);
      showToast(err.response?.data?.error || err.message || "Failed to test Jira connection.", "error");
    } finally {
      setTesting(false);
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

  return (
    <div className="py-2 max-w-4xl space-y-6">
      <div className="pb-2 border-b theme-border">
        <h1 className="text-2xl sm:text-3xl font-black theme-heading tracking-tight">Enterprise Connectors</h1>
        <p className="text-xs sm:text-sm theme-muted mt-1">Configure external data sources, project management webhooks, and ERP feeds.</p>
      </div>

      <div className="theme-card rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b theme-border flex items-center gap-3">
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl border border-blue-500/20">
            <Server size={22} />
          </div>
          <div>
            <h2 className="text-base font-bold theme-heading">Jira Cloud / Data Center Connector</h2>
            <p className="text-xs theme-muted">Synchronize sprint velocity, deliverable issues, and blocker tickets automatically.</p>
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold theme-heading">Jira Base URL</label>
                <input
                  type="url"
                  name="base_url"
                  value={settings.base_url}
                  onChange={handleChange}
                  placeholder="https://your-domain.atlassian.net"
                  disabled={!canEdit}
                  className="w-full px-4 py-2.5 theme-input rounded-xl text-xs focus:outline-none focus:border-[#FF5A14] disabled:opacity-50 transition-colors"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold theme-heading">Service Account Email</label>
                <input
                  type="email"
                  name="username_email"
                  value={settings.username_email}
                  onChange={handleChange}
                  placeholder="integration@enterprise.com"
                  disabled={!canEdit}
                  className="w-full px-4 py-2.5 theme-input rounded-xl text-xs focus:outline-none focus:border-[#FF5A14] disabled:opacity-50 transition-colors"
                  required
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-bold theme-heading">
                  API Token / Secret Key <span className="theme-muted font-normal text-[11px] ml-1">(Leave blank to keep existing encrypted secret)</span>
                </label>
                <input
                  type="password"
                  name="api_token"
                  value={settings.api_token}
                  onChange={handleChange}
                  placeholder="••••••••••••••••••••••••"
                  disabled={!canEdit}
                  className="w-full px-4 py-2.5 theme-input rounded-xl text-xs focus:outline-none focus:border-[#FF5A14] disabled:opacity-50 transition-colors font-mono"
                />
              </div>
            </div>

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
                  <span>{testing ? 'Testing...' : 'Test Connection'}</span>
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
    </div>
  );
};

export default SettingsPage;
