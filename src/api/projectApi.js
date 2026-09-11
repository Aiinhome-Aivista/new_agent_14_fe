import api from './api';

export const projectApi = {
  getProjects: async () => {
    const response = await api.get('/projects');
    return response.data?.projects || [];
  },

  getProject: async (id) => {
    const response = await api.get(`/projects/${id}`);
    return response.data?.project || null;
  },

  createProject: async (projectData) => {
    const response = await api.post('/projects', projectData);
    return response.data;
  },

  updateProject: async (id, projectData) => {
    const response = await api.put(`/projects/${id}`, projectData);
    return response.data;
  },

  deleteProject: async (id) => {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  },

  syncProjectConnectors: async (projectId) => {
    const response = await api.post(`/settings/sync-project/${projectId}`);
    return response.data;
  }
};

export default projectApi;
