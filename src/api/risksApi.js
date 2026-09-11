import api from './api';

export const risksApi = {
  getRisks: async (projectId = null) => {
    const params = projectId ? { project_id: projectId } : {};
    const response = await api.get('/risks/', { params });
    return response.data;
  },
  updateRisk: async (riskId, data) => {
    const response = await api.put(`/risks/${riskId}`, data);
    return response.data;
  },
  createRisk: async (data) => {
    const response = await api.post('/risks/', data);
    return response.data;
  },
  deleteRisk: async (riskId) => {
    const response = await api.delete(`/risks/${riskId}`);
    return response.data;
  },
  pushToJira: async (riskId) => {
    const response = await api.post(`/risks/${riskId}/push-to-jira`);
    return response.data;
  }
};
