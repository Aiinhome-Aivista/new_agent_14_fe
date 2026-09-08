import api from './api';

export const risksApi = {
  getRisks: async () => {
    const response = await api.get('/risks/');
    return response.data;
  }
};
