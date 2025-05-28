import { computed } from 'vue'
import { useProjectStore } from '@/stores/projectStore'

export function useProjectContext() {
  const projectStore = useProjectStore()

  const project = computed(() => projectStore.activeProject)
  const status = computed(() => {
    if (projectStore.isLoading) return 'loading'
    if (projectStore.error) return 'error'
    if (projectStore.activeProject) return 'ready'
    return 'idle'
  })

  const loadProject = async (identifier: string): Promise<boolean> => {
    // Early return if we already have the correct project loaded
    if (project.value && status.value === 'ready') {
      const currentProject = project.value
      const isCorrectProject = 
        (currentProject.provider === 'gitlab' && String(currentProject.id) === identifier) ||
        (currentProject.provider === 'github' && currentProject.path_with_namespace === identifier)
      
      if (isCorrectProject) {
        return true
      }
    }

    // Load the project
    await projectStore.fetchProjectDetails(identifier)
    
    // Return success status
    return status.value === 'ready'
  }

  return {
    project,
    status,
    loadProject
  }
} 