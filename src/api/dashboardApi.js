import api from './api';

export const dashboardApi = {
  getSnapshot: async () => {
    const response = await api.get('/dashboard/snapshot');
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
  }
};
