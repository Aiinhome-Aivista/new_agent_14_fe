import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { projectApi } from '../api/projectApi';
import { useAuth } from './AuthContext';

export const ALL_PROJECTS_CONTEXT = {
  id: 'all',
  name: 'All Projects (Portfolio View)',
  jira_key: 'ALL'
};

const ProjectContext = createContext(null);

export const ProjectProvider = ({ children }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(() => {
    try {
      const saved = localStorage.getItem('vpm_active_project');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.id === 'all' || parsed?.jira_key === 'ALL') {
          return ALL_PROJECTS_CONTEXT;
        }
        return parsed;
      }
      return null;
    } catch (e) {
      return null;
    }
  });
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [error, setError] = useState(null);

  const refreshProjects = useCallback(async () => {
    if (!user) return [];
    try {
      setLoadingProjects(true);
      setError(null);
      const list = await projectApi.getProjects();
      setProjects(list);

      // Verify or auto-select active project
      setActiveProject(prev => {
        if (prev && (prev.id === 'all' || prev.jira_key === 'ALL')) {
          localStorage.setItem('vpm_active_project', JSON.stringify(ALL_PROJECTS_CONTEXT));
          return ALL_PROJECTS_CONTEXT;
        }
        if (!prev && list.length > 0) {
          const defaultProj = list[0];
          localStorage.setItem('vpm_active_project', JSON.stringify(defaultProj));
          return defaultProj;
        }
        if (prev && list.length > 0) {
          const matched = list.find(p => p.id === prev.id || p.jira_key === prev.jira_key);
          if (matched) {
            localStorage.setItem('vpm_active_project', JSON.stringify(matched));
            return matched;
          }
        }
        return prev;
      });

      return list;
    } catch (err) {
      console.error("Failed to load projects:", err);
      setError("Unable to synchronize enterprise projects.");
      return [];
    } finally {
      setLoadingProjects(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshProjects();
    } else {
      setProjects([]);
      setActiveProject(null);
      localStorage.removeItem('vpm_active_project');
    }
  }, [user, refreshProjects]);

  const selectProject = (projectOrId) => {
    let target = null;
    if (!projectOrId || projectOrId === 'all' || (typeof projectOrId === 'object' && (projectOrId.id === 'all' || projectOrId.jira_key === 'ALL'))) {
      target = ALL_PROJECTS_CONTEXT;
    } else if (typeof projectOrId === 'object' && projectOrId !== null) {
      target = projectOrId;
    } else {
      target = projects.find(p => p.id === Number(projectOrId) || p.jira_key === String(projectOrId));
    }

    if (target) {
      setActiveProject(target);
      try {
        localStorage.setItem('vpm_active_project', JSON.stringify(target));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const createProject = async (projectData) => {
    const res = await projectApi.createProject(projectData);
    if (res?.project) {
      setProjects(prev => [...prev, res.project]);
      selectProject(res.project);
    } else {
      await refreshProjects();
    }
    return res;
  };

  const updateProject = async (id, projectData) => {
    const res = await projectApi.updateProject(id, projectData);
    await refreshProjects();
    return res;
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        loadingProjects,
        error,
        selectProject,
        refreshProjects,
        createProject,
        updateProject,
        setActiveProject
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

export default ProjectContext;
