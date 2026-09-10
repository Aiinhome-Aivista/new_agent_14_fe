import api from './api';
 
export const guardrailsApi = {
  getGuardrails: async () => {
    const response = await api.get('/guardrails');
    return response.data;
  },
  resolveQueueItem: async (itemId, decision, reasoning) => {
    const response = await api.post(`/guardrails/queue/${itemId}/resolve`, {
      decision,
      reasoning
    });
    return response.data;
  },
  createPolicy: async (policyData) => {
    const response = await api.post('/guardrails/policies', policyData);
    return response.data;
  },
  togglePolicy: async (policyId) => {
    const response = await api.patch(`/guardrails/policies/${encodeURIComponent(policyId)}/toggle`);
    return response.data;
  },
  deletePolicy: async (policyId) => {
    const response = await api.delete(`/guardrails/policies/${encodeURIComponent(policyId)}`);
    return response.data;
  },
  getSuggestions: async (projectId = 1, refresh = false) => {
    const response = await api.get(`/guardrails/suggestions?project_id=${projectId}${refresh ? '&refresh=true' : ''}`);
    return response.data;
  }
};

