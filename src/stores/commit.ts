import { defineStore } from 'pinia'
import { Commit, CommitBundle, Branch } from '../types/commit'

export const useCommitStore = defineStore('commit', {
  state: () => ({
    commits: [] as Commit[],
    branches: [] as Branch[],
    selectedBranch: '' as string,
    selectedCommits: [] as string[],
    commitBundles: [] as CommitBundle[],
    isLoading: false,
    currentPage: 1,
    perPage: 10, // Fixed number of commits per fetch
    totalCommits: 0,
    isMore: true, // Initially assume there are more commits
    since: null as string | null,
    until: null as string | null
  }),
  actions: {
    setCommits(commits: Commit[]) {
      this.commits = commits
    },
    addCommits(commits: Commit[]) {
      this.commits = [...this.commits, ...commits]
    },
    setSelectedCommits(commitIds: string[]) {
      this.selectedCommits = commitIds
    },
    setBranches(branches: Branch[]) {
      this.branches = branches
    },
    setSelectedBranch(branch: string) {
      this.selectedBranch = branch
    },
    setPerPage(perPage: number) {
      this.perPage = perPage
    },
    setCommitBundles(bundles: CommitBundle[]) {
      this.commitBundles = bundles
    },
    setLoading(isLoading: boolean) {
      this.isLoading = isLoading
    },
    setCurrentPage(page: number) {
      this.currentPage = page
    },
    incrementCurrentPage() {
      this.currentPage += 1
    },
    setTotalCommits(total: number) {
      this.totalCommits = total
    },
    setIsMore(isMore: boolean) {
      this.isMore = isMore
    },
    setSince(since: string | null) {
      this.since = since
    },
    setUntil(until: string | null) {
      this.until = until
    },
    resetPagination() {
      this.currentPage = 1
      this.totalCommits = 0
      this.isMore = true
    },
    clearCommits() {
      this.commits = []
      this.selectedCommits = []
      this.commitBundles = []
      this.currentPage = 1
      this.totalCommits = 0
      this.isMore = true
      this.since = null
      this.until = null
      this.perPage = 10
    }
  }
})
