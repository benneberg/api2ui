import { type Project, type jdCard } from "../types";

const STORAGE_KEY = 'api2ui_projects';

export const projectService = {
  saveProject(name: string, jdCard: jdCard | null): Project {
    const projects = this.getAllProjects();
    const existingIndex = projects.findIndex(p => p.name === name);
    
    const project: Project = {
      id: existingIndex >= 0 ? projects[existingIndex].id : Math.random().toString(36).substring(7),
      name,
      jdCard,
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      projects[existingIndex] = project;
    } else {
      projects.push(project);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    return project;
  },

  getAllProjects(): Project[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  deleteProject(id: string) {
    const projects = this.getAllProjects().filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }
};
