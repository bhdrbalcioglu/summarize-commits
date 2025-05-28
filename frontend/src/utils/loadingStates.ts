/**
 * Utility functions for managing loading states accurately
 * Helps prevent false skeleton states and improves UX
 */

export type LoadingStatus = 'idle' | 'loading' | 'ready' | 'error'

/**
 * Determines if we should show a skeleton loader
 * Only shows skeleton when actually loading initial data (no existing data)
 */
export function shouldShowSkeleton(
  status: LoadingStatus,
  hasData: boolean,
  errorCondition?: boolean
): boolean {
  // Never show skeleton if there's an error
  if (errorCondition) return false
  
  // Only show skeleton when loading and no data exists
  return status === 'loading' && !hasData
}

/**
 * Determines if we should show inline loading indicators
 * Shows when loading additional data or refreshing existing data
 */
export function shouldShowInlineLoading(
  status: LoadingStatus,
  hasData: boolean
): boolean {
  // Show inline loading when loading and data already exists
  return status === 'loading' && hasData
}

/**
 * Determines if content is ready to display
 */
export function isContentReady(
  status: LoadingStatus,
  hasData: boolean
): boolean {
  return status === 'ready' && hasData
}

/**
 * Determines if we should show an empty state
 */
export function shouldShowEmptyState(
  status: LoadingStatus,
  hasData: boolean,
  errorCondition?: boolean
): boolean {
  return status === 'ready' && !hasData && !errorCondition
}

/**
 * Determines if we should show an error state
 */
export function shouldShowErrorState(
  status: LoadingStatus,
  errorCondition?: boolean
): boolean {
  return status === 'error' || Boolean(errorCondition)
}

/**
 * Helper for pagination loading states
 */
export function getPaginationLoadingState(
  status: LoadingStatus,
  currentPage: number,
  totalItems: number,
  itemsPerPage: number
) {
  const hasMorePages = currentPage * itemsPerPage < totalItems
  const isLoadingMore = status === 'loading' && totalItems > 0
  
  return {
    hasMorePages,
    isLoadingMore,
    canLoadMore: hasMorePages && !isLoadingMore
  }
}

/**
 * Combines multiple loading states for complex components
 */
export function combineLoadingStates(...statuses: LoadingStatus[]): LoadingStatus {
  // If any are loading, overall is loading
  if (statuses.some(status => status === 'loading')) return 'loading'
  
  // If any are error, overall is error
  if (statuses.some(status => status === 'error')) return 'error'
  
  // If all are ready, overall is ready
  if (statuses.every(status => status === 'ready')) return 'ready'
  
  // Otherwise, idle
  return 'idle'
} 