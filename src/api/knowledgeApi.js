import api from './api';
 
export const knowledgeApi = {
  getKnowledge: async () => {
    const response = await api.get('/knowledge');
    return response.data;
  },
  searchKnowledge: async (query) => {
    const response = await api.post('/knowledge/search', { query });
    return response.data;
  }
};
