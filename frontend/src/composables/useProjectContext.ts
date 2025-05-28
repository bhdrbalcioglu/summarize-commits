import { computed } from 'vue'
import { useProjectStore } from '@/stores/projectStore'
import { loadProjectForRoute } from '@/utils/projectLoader'

export function useProjectContext() {
  const projectStore = useProjectStore()

  const project = computed(() => projectStore.activeProject)
  const status = computed(() => projectStore.status)

  const loadProject = async (identifier: string): Promise<boolean> => {
    return await loadProjectForRoute(identifier)
  }

  return {
    project,
    status,
    loadProject
  }
} 