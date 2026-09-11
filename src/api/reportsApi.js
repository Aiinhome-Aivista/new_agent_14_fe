import api from './api';

export const reportsApi = {
  getReports: async (projectId = null) => {
    const params = projectId ? { project_id: projectId } : {};
    const response = await api.get('/reports/list', { params });
    return response.data;
  },
  downloadReport: async (id, targetName) => {
    const filename = targetName || id;
    const isPdf = filename?.toLowerCase().endsWith('.pdf');
    const mimeType = isPdf 
      ? 'application/pdf' 
      : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    try {
      const response = await api.get(`/reports/download/${encodeURIComponent(id)}`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        if (link.parentNode) link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 3000);
      return true;
    } catch (err) {
      console.warn("Blob download failed, using direct navigation fallback:", err);
      window.open(`http://localhost:5000/api/reports/download/${encodeURIComponent(id)}`, '_blank');
      return true;
    }
  },
  generateReport: async (projectId = 1) => {
    const response = await api.post('/reports/generate', { project_id: projectId });
    return response.data;
  }
};
