import api from './api';

export const settingsApi = {
  // Generic provider methods
  getAllSettings: async (projectId = null) => {
    const params = projectId ? { project_id: projectId } : {};
    const response = await api.get('/settings/', { params });
    return response.data;
  },
  getProviderSettings: async (provider, projectId = null) => {
    const params = projectId ? { project_id: projectId } : {};
    const response = await api.get(`/settings/${provider}`, { params });
    return response.data;
  },
  saveProviderSettings: async (provider, settings, projectId = null) => {
    const payload = projectId ? { ...settings, project_id: projectId } : settings;
    const response = await api.post(`/settings/${provider}`, payload);
    return response.data;
  },
  testProviderConnection: async (provider, projectId = null, settings = {}) => {
    const payload = {
      ...(settings || {}),
      ...(projectId ? { project_id: projectId } : {})
    };
    const response = await api.post(`/settings/${provider}/test-connection`, payload);
    return response.data;
  },
  disconnectProvider: async (provider, projectId = null) => {
    const payload = projectId ? { project_id: projectId } : {};
    const response = await api.post(`/settings/${provider}/disconnect`, payload);
    return response.data;
  },
  loadDemoPresets: async (provider = null, projectId = null) => {
    const payload = {};
    if (provider) payload.provider = provider;
    if (projectId) payload.project_id = projectId;
    const response = await api.post('/settings/demo-presets', payload);
    return response.data;
  },
  getSchedulerStatus: async () => {
    const response = await api.get('/settings/scheduler');
    return response.data;
  },
  triggerSchedulerSync: async () => {
    const response = await api.post('/settings/scheduler/trigger');
    return response.data;
  },
  syncGoogleDrive: async (projectId) => {
    const response = await api.post(`/settings/sync-gdrive/${projectId}`);
    return response.data;
  },
  syncOneDrive: async (projectId) => {
    const response = await api.post(`/settings/sync-onedrive/${projectId}`);
    return response.data;
  },

  // Backward-compatible Jira aliases
  getJiraSettings: async (projectId = null) => {
    const params = projectId ? { project_id: projectId } : {};
    const response = await api.get('/settings/jira', { params });
    return response.data;
  },
  saveJiraSettings: async (settings, projectId = null) => {
    const payload = projectId ? { ...settings, project_id: projectId } : settings;
    const response = await api.post('/settings/jira', payload);
    return response.data;
  },
  testJiraConnection: async (projectId = null) => {
    const payload = projectId ? { project_id: projectId } : {};
    const response = await api.post('/settings/jira/test-connection', payload);
    return response.data;
  }
};

