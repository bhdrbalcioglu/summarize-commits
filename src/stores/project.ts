import { defineStore } from "pinia";
import { Project } from "../types/project"; // Import the Project type from the new file

export const useProjectStore = defineStore("project", {
  state: () => ({
    projectId: null as number | null,
    projectName: null as string | null,
    projectDescription: null as string | null,
    projectUrl: null as string | null,
    projectVisibility: null as string | null,
    projectLastActivityAt: null as string | null,
    projectNamespace: null as string | null,
    projectCreatedAt: null as string | null,
    projectStarCount: null as number | null,
    projectForksCount: null as number | null,
    projectDefaultBranch: null as string | null,
    isLoading: false as boolean,
  }),
  actions: {
    setProjectDetails(project: Project) {
      this.projectId = project.id;
      this.projectName = project.name;
      this.projectDescription = project.description;
      this.projectUrl = project.web_url;
      this.projectVisibility = project.visibility;
      this.projectLastActivityAt = project.last_activity_at;
      this.projectNamespace = project.namespace.name;
      this.projectCreatedAt = project.created_at;
      this.projectStarCount = project.star_count;
      this.projectForksCount = project.forks_count;
      this.projectDefaultBranch = project.default_branch;
      this.isLoading = false;
    },
    clearProjectDetails() {
      this.projectId = null;
      this.projectName = null;
      this.projectDescription = null;
      this.projectUrl = null;
      this.projectVisibility = null;
      this.projectLastActivityAt = null;
      this.projectNamespace = null;
      this.projectCreatedAt = null;
      this.projectStarCount = null;
      this.projectForksCount = null;
      this.projectDefaultBranch = null;
      this.isLoading = false;
    },
  },
  persist: true,
});
