import api from './api';

export const settingsApi = {
  // Generic provider methods
  getAllSettings: async () => {
    const response = await api.get('/settings/');
    return response.data;
  },
  getProviderSettings: async (provider) => {
    const response = await api.get(`/settings/${provider}`);
    return response.data;
  },
  saveProviderSettings: async (provider, settings) => {
    const response = await api.post(`/settings/${provider}`, settings);
    return response.data;
  },
  testProviderConnection: async (provider) => {
    const response = await api.post(`/settings/${provider}/test-connection`);
    return response.data;
  },
  loadDemoPresets: async (provider = null) => {
    const response = await api.post('/settings/demo-presets', provider ? { provider } : {});
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

  // Backward-compatible Jira aliases
  getJiraSettings: async () => {
    const response = await api.get('/settings/jira');
    return response.data;
  },
  saveJiraSettings: async (settings) => {
    const response = await api.post('/settings/jira', settings);
    return response.data;
  },
  testJiraConnection: async () => {
    const response = await api.post('/settings/jira/test-connection');
    return response.data;
  }
};
