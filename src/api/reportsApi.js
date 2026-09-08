import api from './api';

export const reportsApi = {
  getReports: async () => {
    const response = await api.get('/reports/list');
    return response.data;
  },
  downloadReport: async (id) => {
    const response = await api.get(`/reports/download/${id}`, {
        responseType: 'blob'
    });
    
    // Create blob link to download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', id);
    document.body.appendChild(link);
    link.click();
    link.remove();
    return true;
  },
  generateReport: async (projectId = 1) => {
    const response = await api.post('/reports/generate', { project_id: projectId });
    return response.data;
  }
};
