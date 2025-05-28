import { ref, type Ref } from 'vue'
import type { Project } from '@/types/project'
import type { Commit, Branch } from '@/types/commit'

/**
 * Event payload interfaces for type safety
 */
export interface EventPayloads {
  // Authentication events
  AUTH_STATUS_CHANGED: { isAuthenticated: boolean; provider: string | null }
  USER_LOGGED_OUT: void

  // Project events
  PROJECT_LOADING_STARTED: { projectIdentifier: string }
  PROJECT_LOADED: { project: Project }
  PROJECT_LOADING_FAILED: { error: string; projectIdentifier: string }
  PROJECT_SELECTED: { project: Project }

  // Branch events
  BRANCHES_LOADING_STARTED: { projectId: string }
  BRANCHES_LOADED: { branches: Branch[]; projectId: string }
  BRANCHES_LOADING_FAILED: { error: string; projectId: string }
  BRANCH_SELECTED: { branch: Branch; projectId: string }
  DEFAULT_BRANCH_SELECTED: { branch: Branch; projectId: string }

  // Commit events
  COMMITS_LOADING_STARTED: { branchName: string; projectId: string }
  COMMITS_LOADED: { commits: Commit[]; branchName: string; projectId: string; hasMore: boolean }
  COMMITS_LOADING_FAILED: { error: string; branchName: string; projectId: string }
  COMMIT_SELECTION_CHANGED: { commitId: string; isSelected: boolean }
  COMMIT_FILTERS_CHANGED: { filters: Record<string, any> }

  // Navigation events
  ROUTE_CHANGED: { to: string; from: string; params: Record<string, any> }
  NAVIGATION_REQUESTED: { route: string; params?: Record<string, any> }

  // UI events
  LOADING_STATE_CHANGED: { component: string; isLoading: boolean }
  ERROR_OCCURRED: { component: string; error: string }
  SUCCESS_MESSAGE: { message: string }

  // Data refresh events
  REFRESH_REQUESTED: { component: string; data?: any }
  CACHE_INVALIDATED: { key: string }
}

export type EventName = keyof EventPayloads
export type EventPayload<T extends EventName> = EventPayloads[T]

/**
 * Event listener function type
 */
export type EventListener<T extends EventName> = (payload: EventPayload<T>) => void | Promise<void>

/**
 * Event bus implementation with type safety
 */
class TypedEventBus {
  private listeners: Map<EventName, Set<EventListener<any>>> = new Map()
  private onceListeners: Map<EventName, Set<EventListener<any>>> = new Map()
  private eventHistory: Array<{ event: EventName; payload: any; timestamp: number }> = []
  private maxHistorySize = 100

  /**
   * Subscribe to an event
   */
  on<T extends EventName>(event: T, listener: EventListener<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(listener)

    // Return unsubscribe function
    return () => this.off(event, listener)
  }

  /**
   * Subscribe to an event once
   */
  once<T extends EventName>(event: T, listener: EventListener<T>): () => void {
    if (!this.onceListeners.has(event)) {
      this.onceListeners.set(event, new Set())
    }
    this.onceListeners.get(event)!.add(listener)

    // Return unsubscribe function
    return () => this.offOnce(event, listener)
  }

  /**
   * Unsubscribe from an event
   */
  off<T extends EventName>(event: T, listener: EventListener<T>): void {
    this.listeners.get(event)?.delete(listener)
  }

  /**
   * Unsubscribe from a once event
   */
  offOnce<T extends EventName>(event: T, listener: EventListener<T>): void {
    this.onceListeners.get(event)?.delete(listener)
  }

  /**
   * Emit an event
   */
  async emit<T extends EventName>(event: T, payload: EventPayload<T>): Promise<void> {
    // Add to history
    this.eventHistory.push({
      event,
      payload,
      timestamp: Date.now()
    })

    // Trim history if needed
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift()
    }

    // Execute regular listeners
    const regularListeners = this.listeners.get(event)
    if (regularListeners) {
      const promises = Array.from(regularListeners).map((listener) => {
        try {
          return Promise.resolve(listener(payload))
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error)
          return Promise.resolve()
        }
      })
      await Promise.all(promises)
    }

    // Execute once listeners
    const onceListeners = this.onceListeners.get(event)
    if (onceListeners) {
      const promises = Array.from(onceListeners).map((listener) => {
        try {
          return Promise.resolve(listener(payload))
        } catch (error) {
          console.error(`Error in once event listener for ${event}:`, error)
          return Promise.resolve()
        }
      })
      await Promise.all(promises)

      // Clear once listeners after execution
      this.onceListeners.delete(event)
    }
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(event?: EventName): void {
    if (event) {
      this.listeners.delete(event)
      this.onceListeners.delete(event)
    } else {
      this.listeners.clear()
      this.onceListeners.clear()
    }
  }

  /**
   * Get event history for debugging
   */
  getEventHistory(): Array<{ event: EventName; payload: any; timestamp: number }> {
    return [...this.eventHistory]
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = []
  }

  /**
   * Get active listeners count for debugging
   */
  getListenerCount(event?: EventName): number {
    if (event) {
      const regular = this.listeners.get(event)?.size || 0
      const once = this.onceListeners.get(event)?.size || 0
      return regular + once
    }

    let total = 0
    for (const listeners of this.listeners.values()) {
      total += listeners.size
    }
    for (const listeners of this.onceListeners.values()) {
      total += listeners.size
    }
    return total
  }
}

/**
 * Global event bus instance
 */
export const eventBus = new TypedEventBus()

/**
 * Composable for using event bus in components
 */
export function useEventBus() {
  const activeListeners: Array<() => void> = []

  const on = <T extends EventName>(event: T, listener: EventListener<T>) => {
    const unsubscribe = eventBus.on(event, listener)
    activeListeners.push(unsubscribe)
    return unsubscribe
  }

  const once = <T extends EventName>(event: T, listener: EventListener<T>) => {
    const unsubscribe = eventBus.once(event, listener)
    activeListeners.push(unsubscribe)
    return unsubscribe
  }

  const emit = <T extends EventName>(event: T, payload: EventPayload<T>) => {
    return eventBus.emit(event, payload)
  }

  const cleanup = () => {
    activeListeners.forEach((unsubscribe) => unsubscribe())
    activeListeners.length = 0
  }

  return {
    on,
    once,
    emit,
    cleanup,
    eventBus
  }
}

/**
 * Development helper for debugging events
 */
export function enableEventDebugging() {
  if (import.meta.env.DEV) {
    const originalEmit = eventBus.emit.bind(eventBus)
    eventBus.emit = async function <T extends EventName>(event: T, payload: EventPayload<T>) {
      console.log(`🚀 Event emitted: ${event}`, payload)
      return originalEmit(event, payload)
    }
  }
}
