import { type Project, type JDCard } from "../types";

const STORAGE_KEY = 'api2ui_projects';

export const projectService = {
  saveProject(name: string, jdCard: JDCard | null): Project {
    const projects = this.getAllProjects();
    const existingIndex = projects.findIndex(p => p.name === name);
    
    let currentProject: Project;

    if (existingIndex >= 0) {
      currentProject = projects[existingIndex];
      
      // Handle versioning if jdCard changed
      if (jdCard && currentProject.jdCard) {
        const isDifferent = JSON.stringify(jdCard) !== JSON.stringify(currentProject.jdCard);
        if (isDifferent) {
          // Push old one to history
          const history = currentProject.versionHistory || [];
          const updatedHistory = [currentProject.jdCard, ...history].slice(0, 10); // Keep last 10 versions
          
          // Increment version
          const oldVersion = currentProject.jdCard.version || '1.0.0';
          const [major, minor, patch] = oldVersion.split('.').map(Number);
          const newVersion = `${major}.${minor}.${patch + 1}`;
          
          jdCard.version = newVersion;
          currentProject.jdCard = jdCard;
          currentProject.versionHistory = updatedHistory;
        }
      } else if (jdCard && !currentProject.jdCard) {
        jdCard.version = '1.0.0';
        currentProject.jdCard = jdCard;
      }
      
      currentProject.updatedAt = new Date().toISOString();
      projects[existingIndex] = currentProject;
    } else {
      if (jdCard) jdCard.version = '1.0.0';
      currentProject = {
        id: Math.random().toString(36).substring(7),
        name,
        jdCard,
        versionHistory: [],
        updatedAt: new Date().toISOString()
      };
      projects.push(currentProject);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    return currentProject;
  },

  getAllProjects(): Project[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  deleteProject(id: string) {
    const projects = this.getAllProjects().filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  },

  revertToVersion(projectId: string, versionIndex: number): Project | null {
    const projects = this.getAllProjects();
    const projectIndex = projects.findIndex(p => p.id === projectId);
    if (projectIndex === -1) return null;

    const project = projects[projectIndex];
    if (!project.versionHistory || project.versionHistory.length <= versionIndex) return null;

    const targetJDCard = project.versionHistory[versionIndex];
    const newHistory = [...project.versionHistory];
    
    // Move current to history (as a new version potentially, but user just wants to "revert")
    // Let's just swap them
    if (project.jdCard) {
      newHistory.splice(versionIndex, 1, project.jdCard);
    } else {
      newHistory.splice(versionIndex, 1);
    }

    project.jdCard = targetJDCard;
    project.versionHistory = newHistory;
    project.updatedAt = new Date().toISOString();

    projects[projectIndex] = project;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    return project;
  }
};
