import api from './api';

export const settingsApi = {
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

