import api from './api';

export const dashboardApi = {
  getSnapshot: async (projectId = null) => {
    const params = projectId ? { project_id: projectId } : {};
    const response = await api.get('/dashboard/snapshot', { params });
    // The backend returns a snapshot object containing 'data' JSON
    let payload = (response.data && response.data.data !== undefined) ? response.data.data : response.data;
    if (typeof payload === 'string') {
        try {
            payload = JSON.parse(payload);
        } catch (e) {
            console.error("Failed to parse dashboard data string", e);
        }
    }
    return payload; 
  },
  getProjectDetails: async (id) => {
    const response = await api.get(`/dashboard/projects/${id}`);
    let payload = response.data;
    if (typeof payload === 'string') {
        try {
            payload = JSON.parse(payload);
        } catch (e) {
            console.error("Failed to parse project details string", e);
        }
    }
    return payload;
  },
  getProjectTeam: async (projectId) => {
    const response = await api.get(`/dashboard/projects/${projectId}/team`);
    let payload = response.data;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch (e) {
        console.error("Failed to parse project team string", e);
      }
    }
    return payload;
  },
  getResourceDetail: async (projectId, resourceId) => {
    const response = await api.get(`/dashboard/projects/${projectId}/team/${resourceId}`);
    let payload = response.data;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch (e) {
        console.error("Failed to parse resource detail string", e);
      }
    }
    return payload;
  },
  getForecast: async (projectId = null, refresh = false) => {
    const params = {};
    if (projectId) params.project_id = projectId;
    if (refresh) params.refresh = 'true';
    const response = await api.get('/dashboard/forecast', { params });
    return response.data;
  },
  getMitigationPlan: async (projectId, refresh = false) => {
    const params = {};
    if (refresh) params.refresh = 'true';
    const response = await api.get(`/dashboard/projects/${projectId}/mitigation-plan`, { params });
    let payload = response.data?.data || response.data;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch (e) {
        console.error("Failed to parse mitigation plan string", e);
      }
    }
    return payload;
  },
  updateStrategyStatus: async (projectId, strategyId, status, progressPct = null) => {
    const response = await api.post(`/dashboard/projects/${projectId}/mitigation-plan/strategy-status`, {
      strategy_id: strategyId,
      status,
      progress_pct: progressPct
    });
    return response.data;
  },
  adoptStrategyToBacklog: async (projectId, strategy) => {
    const response = await api.post(`/dashboard/projects/${projectId}/mitigation-plan/adopt-to-backlog`, {
      strategy_id: strategy.id,
      title: strategy.title,
      owner: strategy.owner,
      priority: strategy.priority,
      objective: strategy.objective
    });
    return response.data;
  }
};
