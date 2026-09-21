import api from './api';

export const ingestionApi = {
  uploadDocument: async (file, onProgress, metadata = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata.uploaded_by) formData.append('uploaded_by', metadata.uploaded_by);
    if (metadata.uploaded_by_role) formData.append('uploaded_by_role', metadata.uploaded_by_role);
    if (metadata.project_id) formData.append('project_id', metadata.project_id);
    if (metadata.accuracy_score !== undefined) formData.append('accuracy_score', metadata.accuracy_score);
    
    // Smooth progress representation reflecting multi-agent LLM analysis
    if (onProgress) {
        let p = 12;
        onProgress(p);
        const interval = setInterval(() => {
            if (p < 40) {
                p += 3.5;
            } else if (p < 70) {
                p += 1.8;
            } else if (p < 88) {
                p += 0.9;
            } else if (p < 98) {
                p += 0.4;
            } else if (p < 99.4) {
                p += 0.1;
            }
            onProgress(Math.min(Math.round(p), 99));
        }, 1000);
        
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
  },
  getProjectConnectors: async (projectId = null) => {
    const params = projectId ? { project_id: projectId } : {};
    const response = await api.get('/ingestion/connectors', { params });
    return response.data;
  },
  fetchConnectorData: async (provider, projectId = null) => {
    const params = { provider, ...(projectId ? { project_id: projectId } : {}) };
    const response = await api.get('/ingestion/connectors/fetch', { params });
    return response.data;
  },
  ingestConnectorItems: async (provider, items, projectId = null, accuracyScore = null) => {
    const payload = { 
      provider, 
      items, 
      ...(projectId ? { project_id: projectId } : {}),
      ...(accuracyScore !== null && accuracyScore !== undefined ? { accuracy_score: accuracyScore } : {})
    };
    const response = await api.post('/ingestion/connectors/ingest', payload);
    return response.data;
  },
  checkAccuracy: async (file, projectId = null) => {
    const formData = new FormData();
    formData.append('file', file);
    if (projectId) formData.append('project_id', projectId);
    const response = await api.post('/ingestion/check-accuracy', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  checkConnectorAccuracy: async (items, projectId = null, provider = 'connector') => {
    const payload = { items, project_id: projectId, provider };
    const response = await api.post('/ingestion/check-connector-accuracy', payload);
    return response.data;
  }
};
