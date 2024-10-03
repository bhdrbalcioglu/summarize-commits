import { useAuthStore } from "../stores/auth";

const getAccessToken = () => {
  const authStore = useAuthStore();
  return authStore.accessToken;
};

// Function to fetch commit details
export const getCommitDetails = async (projectId: string, commitId: string) => {
  const accessToken = getAccessToken();
  const response = await fetch(
    `https://gitlab.com/api/v4/projects/${projectId}/repository/commits/${commitId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch commit details for ${commitId}`);
  }
  const data = await response.json();
  return data;
};

// Function to fetch commit diffs
export const getCommitDiffs = async (projectId: string, commitId: string) => {
  const accessToken = getAccessToken();
  const response = await fetch(
    `https://gitlab.com/api/v4/projects/${projectId}/repository/commits/${commitId}/diff`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch commit diffs for ${commitId}`);
  }
  const data = await response.json();
  return data;
};

// Function to fetch details and diffs for multiple commits and structure the data
export const getCommitsBundle = async (
  projectId: string,
  commitIds: string[]
) => {
  const bundles = await Promise.all(
    commitIds.map(async (commitId) => {
      try {
        const details = await getCommitDetails(projectId, commitId);
        const diffs = await getCommitDiffs(projectId, commitId);

        // Transform the data into the required format
        const filesChanged = diffs.map((diff: any) => ({
          file_path: diff.new_path || diff.old_path,
          diff: diff.diff, // This is the diff text provided by GitLab API
        }));

        return {
          commit_id: details.id,
          message: details.message,
          files_changed: filesChanged,
        };
      } catch (error) {
        console.error(`Error fetching data for commit ${commitId}:`, error);
        return null; // Handle errors per commit as needed
      }
    })
  );

  // Filter out any null entries due to errors
  const filteredBundles = bundles.filter((bundle) => bundle !== null);

  return { commits: filteredBundles };
};

