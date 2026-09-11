import api from './api';

export const ingestionApi = {
  uploadDocument: async (file, onProgress, metadata = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata.uploaded_by) formData.append('uploaded_by', metadata.uploaded_by);
    if (metadata.uploaded_by_role) formData.append('uploaded_by_role', metadata.uploaded_by_role);
    if (metadata.project_id) formData.append('project_id', metadata.project_id);
    
    // Smooth progress representation reflecting multi-agent LLM analysis
    if (onProgress) {
        let p = 5;
        onProgress(p);
        const interval = setInterval(() => {
            if (p < 30) {
                p += 3;
            } else if (p < 65) {
                p += 1.5;
            } else if (p < 85) {
                p += 0.8;
            } else if (p < 96) {
                p += 0.3;
            }
            onProgress(Math.min(Math.round(p), 96));
        }, 1500);
        
        try {
            const response = await api.post('/ingestion/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            clearInterval(interval);
            onProgress(100);
            return response.data;
        } catch (e) {
            clearInterval(interval);
            throw e;
        }
    } else {
        const response = await api.post('/ingestion/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }
  },
  getHistory: async (projectId = null) => {
    const params = projectId ? { project_id: projectId } : {};
    const response = await api.get('/ingestion/history', { params });
    return response.data;
  }
};
