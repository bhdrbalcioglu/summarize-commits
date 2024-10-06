import axios from "axios";
import { useAuthStore } from "../stores/auth";
import { useProjectListStore } from "../stores/projectList";
import { useProjectStore } from "../stores/project";
import { useCommitStore } from "../stores/commit";
import { OrderByOptions } from "../types/projectList";
import { Project } from "../types/project";
import { Commit, CommitDiff, CommitBundle } from "../types/commit";
import { resolveComponent } from "vue";

const getAccessToken = () => {
  const authStore = useAuthStore();
  return authStore.accessToken;
};

const axiosInstance = axios.create({
  baseURL: "https://gitlab.com/api/v4",
});

axiosInstance.interceptors.request.use((config) => {
  config.headers.Authorization = `Bearer ${getAccessToken()}`;
  return config;
});

export interface ProjectFetchParams {
  groupId?: string;
  orderBy: OrderByOptions;
  sortOrder: "asc" | "desc";
  itemsPerPage: number;
  currentPage: number;
  searchTerm?: string;
}

export const fetchProjects = async (params: ProjectFetchParams) => {
  const projectListStore = useProjectListStore();
  projectListStore.setIsLoading(true);

  const url = params.groupId
    ? `/groups/${params.groupId}/projects`
    : "/projects";

  try {
    const response = await axiosInstance.get(url, {
      params: {
        membership: true,
        order_by: params.orderBy,
        sort: params.sortOrder,
        per_page: params.itemsPerPage,
        page: params.currentPage,
        search: params.searchTerm || undefined,
      },
    });

    const projects: Project[] = response.data;
    const totalPages = parseInt(response.headers["x-total-pages"] || "1");
    const totalProjects = parseInt(response.headers["x-total"] || "0");

    projectListStore.updateProjectListState({
      projects,
      totalPages,
      totalProjects,
      currentPage: params.currentPage,
      itemsPerPage: params.itemsPerPage,
      orderBy: params.orderBy,
      sortOrder: params.sortOrder,
      searchTerm: params.searchTerm || "",
    });

    return { projects, totalPages, totalProjects };
  } catch (error) {
    throw error;
  } finally {
    projectListStore.setIsLoading(false);
  }
};

export const fetchProjectDetails = async (projectId: string) => {
  const projectStore = useProjectStore();
  projectStore.isLoading = true;

  try {
    const { data } = await axiosInstance.get(`/projects/${projectId}`);
    projectStore.setProjectDetails(data);
    return data;
  } catch (error) {
    throw error;
  } finally {
    projectStore.isLoading = false;
  }
};

export const fetchBranches = async (projectId: string) => {
  try {
    const response = await axiosInstance.get(
      `/projects/${projectId}/repository/branches`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchCommits = async (
  projectId: string,
  branch: string,
  page: number,
  perPage: number
) => {
  const commitStore = useCommitStore();
  commitStore.setLoading(true);

  console.log(`Fetching commits for project ${projectId}, branch ${branch}, page ${page}, perPage ${perPage}`);

  try {
    const response = await axiosInstance.get(
      `/projects/${projectId}/repository/commits`,
      {
        params: {
          ref_name: branch,
          per_page: perPage,
          page: page,
        },
      }
    );
    console.log(`Received response for commits:`, response.data);

    const commits: Commit[] = response.data;
    const totalCommits = parseInt(response.headers["x-total"] || "0");
    const nextPage = parseInt(response.headers["x-next-page"] || "0");
    
    console.log(`Total commits: ${totalCommits}, Next page: ${nextPage}`);

    commitStore.setIsMore(nextPage > page);

    if (page === 1) {
      console.log(`Setting initial commits for page 1`);
      commitStore.setCommits(commits);
    } else {
      console.log(`Adding ${commits.length} commits to existing list`);
      commitStore.addCommits(commits);
    }

    console.log(`Updating commit store - Current page: ${page}, Total commits: ${totalCommits}`);
    commitStore.setCurrentPage(page);
    commitStore.setTotalCommits(totalCommits);

    console.log(`Returning ${commits.length} commits and total count of ${totalCommits}`);
    return { commits, totalCommits };
  } catch (error) {
    console.error(`Error fetching commits for project ${projectId}:`, error);
    throw error;
  } finally {
    console.log(`Finished fetching commits, setting loading state to false`);
    commitStore.setLoading(false);
  }
};

export const getCommitDetails = async (
  projectId: string,
  commitId: string
): Promise<Commit> => {
  try {
    const response = await axiosInstance.get(
      `/projects/${projectId}/repository/commits/${commitId}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getCommitDiffs = async (
  projectId: string,
  commitId: string
): Promise<CommitDiff[]> => {
  try {
    const response = await axiosInstance.get(
      `/projects/${projectId}/repository/commits/${commitId}/diff`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getCommitsBundle = async (
  projectId: string,
  commitIds: string[]
): Promise<{ commits: CommitBundle[] }> => {
  const commitStore = useCommitStore();
  commitStore.setLoading(true);

  try {
    const bundles = await Promise.all(
      commitIds.map(async (commitId) => {
        const details = await getCommitDetails(projectId, commitId);
        const diffs = await getCommitDiffs(projectId, commitId);

        const filesChanged = diffs.map((diff) => ({
          file_path: diff.new_path || diff.old_path,
          diff: diff.diff,
        }));

        return {
          commit_id: details.id,
          message: details.message,
          files_changed: filesChanged,
        };
      })
    );

    const filteredBundles = bundles.filter(
      (bundle): bundle is CommitBundle => bundle !== null
    );

    commitStore.setCommitBundles(filteredBundles);

    return { commits: filteredBundles };
  } catch (error) {
    throw error;
  } finally {
    commitStore.setLoading(false);
  }
};

export const getUserGroups = async () => {
  try {
    const response = await axiosInstance.get("/groups");
    return response.data;
  } catch (error) {
    throw error;
  }
};
