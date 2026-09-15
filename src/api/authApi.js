import api from './api';

export const authApi = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  register: async (email, password, role) => {
    const response = await api.post('/auth/register', { email, password, role });
    return response.data;
  },
  getUsers: async (role = null) => {
    const params = role ? { role } : {};
    const response = await api.get('/auth/users', { params });
    return response.data;
  }
};
