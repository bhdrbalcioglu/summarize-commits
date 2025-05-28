import { useProjectStore } from '@/stores/projectStore'

export async function loadProjectForRoute(identifier: string): Promise<boolean> {
  const projectStore = useProjectStore()
  
  // Early return if we already have the correct project loaded
  if (projectStore.activeProject && projectStore.status === 'ready') {
    const currentProject = projectStore.activeProject
    const isCorrectProject = 
      (currentProject.provider === 'gitlab' && String(currentProject.id) === identifier) ||
      (currentProject.provider === 'github' && currentProject.path_with_namespace === identifier)
    
    if (isCorrectProject) {
      return true
    }
  }

  // Load the project using the selectProject method
  return await projectStore.selectProject(identifier)
} 