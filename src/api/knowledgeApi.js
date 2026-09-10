import api from './api';
 
export const knowledgeApi = {
  getKnowledge: async (projectId = null) => {
    const params = projectId && projectId !== 'ALL' ? { project_id: projectId } : {};
    const response = await api.get('/knowledge', { params });
    return response.data;
  },
  searchKnowledge: async (query, projectId = null) => {
    const payload = { query };
    if (projectId && projectId !== 'ALL') {
      payload.project_id = projectId;
    }
    const response = await api.post('/knowledge/search', payload);
    return response.data;
  }
};
