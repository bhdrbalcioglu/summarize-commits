// frontend/src/utils/localStorage.ts

/**
 * Utility for managing localStorage with project-scoped keys and safe JSON operations
 */

// Global keys (not project-scoped)
export const GLOBAL_KEYS = {
  AUTH_USER: 'authUser',
  AUTH_PROVIDER: 'authProvider',
  SELECTED_GROUP_ID: 'selectedGroupId',
  SELECTED_PROJECT_ID: 'selectedProjectId',
  AI_TARGET_LANGUAGE: 'aiTargetLanguage',
  AI_AUTHOR_INCLUSION: 'aiIsAuthorIncluded'
} as const

// Project-scoped keys (will be prefixed with project identifier)
export const PROJECT_KEYS = {
  SELECTED_BRANCH: 'selectedBranch',
  COMMIT_FILTERS: 'commitFilters',
  VIEW_PREFERENCES: 'viewPreferences'
} as const

/**
 * Generate a project-scoped key
 */
export function getProjectKey(projectIdentifier: string, key: string): string {
  return `project:${projectIdentifier}:${key}`
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

/**
 * Safe JSON stringify
 */
export function safeJsonStringify(value: any): string {
  try {
    return JSON.stringify(value)
  } catch {
    return ''
  }
}

/**
 * Get value from localStorage with safe JSON parsing
 */
export function getStorageValue<T>(key: string, fallback: T): T {
  const value = localStorage.getItem(key)
  if (typeof fallback === 'string') {
    return (value || fallback) as T
  }
  return safeJsonParse(value, fallback)
}

/**
 * Set value in localStorage with safe JSON stringifying
 */
export function setStorageValue(key: string, value: any): void {
  if (typeof value === 'string') {
    localStorage.setItem(key, value)
  } else {
    localStorage.setItem(key, safeJsonStringify(value))
  }
}

/**
 * Remove value from localStorage
 */
export function removeStorageValue(key: string): void {
  localStorage.removeItem(key)
}

/**
 * Get project-scoped value
 */
export function getProjectStorageValue<T>(projectIdentifier: string, key: string, fallback: T): T {
  const projectKey = getProjectKey(projectIdentifier, key)
  return getStorageValue(projectKey, fallback)
}

/**
 * Set project-scoped value
 */
export function setProjectStorageValue(projectIdentifier: string, key: string, value: any): void {
  const projectKey = getProjectKey(projectIdentifier, key)
  setStorageValue(projectKey, value)
}

/**
 * Remove project-scoped value
 */
export function removeProjectStorageValue(projectIdentifier: string, key: string): void {
  const projectKey = getProjectKey(projectIdentifier, key)
  removeStorageValue(projectKey)
}

/**
 * Clear all project-scoped data for a specific project
 */
export function clearProjectStorage(projectIdentifier: string): void {
  const prefix = `project:${projectIdentifier}:`
  const keysToRemove: string[] = []
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(prefix)) {
      keysToRemove.push(key)
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key))
}