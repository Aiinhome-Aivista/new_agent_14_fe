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
  }
};
