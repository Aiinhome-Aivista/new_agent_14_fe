import api from './api';

export const getStakeholders = async () => {
  const response = await api.get('/stakeholders');
  return response.data;
};

export const bulkCreateStakeholders = async (stakeholders, loginUrl) => {
  const response = await api.post('/stakeholders/bulk-create', {
    stakeholders,
    login_url: loginUrl || window.location.origin + '/login'
  });
  return response.data;
};

export const updateStakeholder = async (userId, data) => {
  const response = await api.put(`/stakeholders/${userId}`, data);
  return response.data;
};

export const deleteStakeholder = async (userId) => {
  const response = await api.delete(`/stakeholders/${userId}`);
  return response.data;
};

export const fetchJiraStakeholders = async (projectId, jiraKey) => {
  const response = await api.get('/stakeholders/fetch-jira', {
    params: { project_id: projectId, jira_key: jiraKey }
  });
  return response.data;
};

export const fetchGoogleDriveStakeholders = async (projectId) => {
  const response = await api.get('/stakeholders/fetch-google-drive', {
    params: { project_id: projectId }
  });
  return response.data;
};

