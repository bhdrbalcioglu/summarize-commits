import { defineStore } from "pinia";
import { Commit, CommitBundle } from "../types/commit";

export const useCommitStore = defineStore("commit", {
  state: () => ({
    commits: [] as Commit[],
    selectedCommits: [] as string[],
    commitBundles: [] as CommitBundle[],
    isLoading: false,
    currentPage: 1,
    itemsPerPage: 10,
    totalCommits: 0,
    isMore: false,
  }),
  actions: {
    setCommits(commits: Commit[]) {
      this.commits = commits;
    },
    addCommits(commits: Commit[]) {
      this.commits.push(...commits);
    },
    setSelectedCommits(commitIds: string[]) {
      this.selectedCommits = commitIds;
    },
    setCommitBundles(bundles: CommitBundle[]) {
      this.commitBundles = bundles;
    },
    setLoading(isLoading: boolean) {
      this.isLoading = isLoading;
    },
    setCurrentPage(page: number) {
      this.currentPage = page;
    },
    setTotalCommits(total: number) {
      this.totalCommits = total;
    },
    setIsMore(isMore: boolean) {
      this.isMore = isMore;
      this.itemsPerPage = this.itemsPerPage + 10;
    },
    clearCommits() {
      this.commits = [];
      this.selectedCommits = [];
      this.commitBundles = [];
      this.currentPage = 1;
      this.totalCommits = 0;
      this.itemsPerPage = 10;
      this.isMore = false;
    },
  },
});
