import api from './api';

export const dashboardApi = {
  getSnapshot: async (projectId = null) => {
    const params = projectId ? { project_id: projectId } : {};
    const response = await api.get('/dashboard/snapshot', { params });
    // The backend returns a snapshot object containing 'data' JSON
    // If the data was stored as a JSON string by mistake, parse it:
    let payload = response.data.data;
    if (typeof payload === 'string') {
        try {
            payload = JSON.parse(payload);
        } catch (e) {
            console.error("Failed to parse dashboard data string", e);
        }
    }
    return payload; 
  },
  getProjectDetails: async (id) => {
    const response = await api.get(`/dashboard/projects/${id}`);
    let payload = response.data;
    if (typeof payload === 'string') {
        try {
            payload = JSON.parse(payload);
        } catch (e) {
            console.error("Failed to parse project details string", e);
        }
    }
    return payload;
  },
  getProjectTeam: async (projectId) => {
    const response = await api.get(`/dashboard/projects/${projectId}/team`);
    let payload = response.data;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch (e) {
        console.error("Failed to parse project team string", e);
      }
    }
    return payload;
  },
  getResourceDetail: async (projectId, resourceId) => {
    const response = await api.get(`/dashboard/projects/${projectId}/team/${resourceId}`);
    let payload = response.data;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch (e) {
        console.error("Failed to parse resource detail string", e);
      }
    }
    return payload;
  },
  getForecast: async (projectId = null) => {
    const params = projectId ? { project_id: projectId } : {};
    const response = await api.get('/dashboard/forecast', { params });
    return response.data;
  }
};
