import api from './api';

export const ingestionApi = {
  uploadDocument: async (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Fake progress since the backend handles it synchronously right now
    if (onProgress) {
        let p = 0;
        const interval = setInterval(() => {
            p += 10;
            if (p <= 90) onProgress(p);
        }, 500);
        
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
  getHistory: async () => {
    const response = await api.get('/ingestion/history');
    return response.data;
  }
};
