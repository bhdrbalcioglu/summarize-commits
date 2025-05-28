// frontend/src/router/index.ts
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import HomeView from '../views/HomeView.vue'
// import GitLabCallbackView from '../views/GitlabCallbackView.vue'; // To be re-evaluated
// import GithubCallbackView from '../views/GithubCallbackView.vue'; // To be re-evaluated
import GroupsView from '../views/GroupsView.vue'
import ProjectsView from '../views/ProjectsView.vue'
import UserView from '../views/UserView.vue'
import ProjectPageView from '../views/ProjectPageView.vue'
import CommitsView from '../views/CommitsView.vue'
import FileTreeView from '../views/FileTreeView.vue'
import CommitSummariesView from '../views/CommitSummariesView.vue'
import { useAuthStore } from '../stores/authStore'
import { useCommitStore } from '../stores/commitStore'
import { useAiResponseStore } from '../stores/aiResponseStore'
import { loadProjectForRoute } from '../utils/projectLoader'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: HomeView,
    meta: { requiresAuth: false, guestOnly: true } // GuestOnly: if logged in, redirect away from home/login
  },
  // OAuth Callback Routes from Backend:
  // The backend now handles the OAuth code exchange and then redirects to a standard frontend route.
  // These specific frontend callback views might no longer be directly hit or needed in the same way.
  // The backend will redirect to a route like '/' or '/dashboard' after successful auth.
  // Let's assume for now the backend redirects to '/' after successful login.
  // If backend redirects to a specific path like '/auth/success', you'd define that.

  // {
  //   path: '/oauth/gitlab/callback', // Or whatever your backend redirects to
  //   name: 'AuthCallbackHandler', // A generic handler or handled by the target route
  //   component: HomeView, // Or a dedicated component that calls authStore.fetchCurrentUser()
  //   // beforeEnter: async (to, from, next) => {
  //   //   const authStore = useAuthStore();
  //   //   if (!authStore.isUserAuthenticated) { // If not yet picked up by initializeAuth
  //   //      await authStore.fetchCurrentUser();
  //   //   }
  //   //   next(authStore.isUserAuthenticated ? '/' : '/'); // Redirect to home or dashboard
  //   // },
  // },
  {
    path: '/groups',
    name: 'Groups',
    component: GroupsView,
    meta: { requiresAuth: true }
  },
  {
    path: '/projects',
    name: 'ProjectsView',
    component: ProjectsView,
    props: (route) => ({
      // Ensure groupStore.selectedGroupId is string | null
      // And projectListStore criteria uses this appropriately
      groupId: route.query.groupId as string | undefined,
      groupName: route.query.groupName as string | undefined
    }),
    meta: { requiresAuth: true }
  },
  {
    path: '/user',
    name: 'User',
    component: UserView,
    meta: { requiresAuth: true }
  },
  {
    // For GitHub, 'projectIdentifier' will be 'owner/repoName'
    // For GitLab, it will be the project ID
    path: '/project/:projectIdentifier(.*)', // Use (.*) to capture paths with slashes for GitHub
    name: 'ProjectPage',
    component: ProjectPageView,
    props: true, // Passes route.params.projectIdentifier as prop
    meta: { requiresAuth: true },
    beforeEnter: async (to) => {
      const authStore = useAuthStore()
      
      // Ensure user is authenticated before attempting to load project
      if (!authStore.isUserAuthenticated) {
        return { name: 'Home', query: { redirect: to.fullPath } }
      }

      const projectIdentifier = Array.isArray(to.params.projectIdentifier) 
        ? to.params.projectIdentifier[0] 
        : to.params.projectIdentifier

      if (!projectIdentifier) {
        return { name: 'User' } // Redirect to user page if no project identifier
      }

      // Load project before allowing navigation
      const success = await loadProjectForRoute(projectIdentifier)
      if (!success) {
        // If project loading failed, redirect to user page
        return { name: 'User' }
      }

      // Allow navigation to proceed
      return true
    },
    children: [
      {
        path: 'commits', // relative path, resolves to /project/:id/commits
        name: 'ProjectCommitsView',
        component: CommitsView
      },
      {
        path: 'tree/:branchName?/:path(.*)*', // For file tree, branch optional, path can be nested
        name: 'ProjectFileTreeView',
        component: FileTreeView,
        props: true
      }
      // Add other project sub-routes here
    ]
  },
  {
    path: '/commit-summaries',
    name: 'CommitSummaries',
    component: CommitSummariesView,
    meta: { requiresAuth: true }
  },
  // Catch-all route for 404 - Define this last
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFoundView.vue') // Example: lazy-load a 404 component
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL), // Use Vite's BASE_URL
  routes
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Ensure auth state is initialized, especially on first load or hard refresh
  // initializeAuth now calls fetchCurrentUser which updates isAuthenticated
  if (!authStore.user && !authStore.isLoading) {
    // Only if not already checked and not currently loading
    await authStore.initializeAuth()
  }

  const requiresAuth = to.meta.requiresAuth
  const guestOnly = to.meta.guestOnly // For routes like login/home that authed users should skip

  if (requiresAuth && !authStore.isUserAuthenticated) {
    // If route requires auth and user is not authenticated, redirect to home (which might be login)
    next({ name: 'Home', query: { redirect: to.fullPath } }) // Save redirect path
  } else if (guestOnly && authStore.isUserAuthenticated) {
    // If route is for guests only (like Home/Login page) and user IS authenticated,
    // redirect to the User page regardless of provider.
    next({ name: 'User' })
  } else {
    next()
  }
})

// Global afterEach hook for store cleanup
router.afterEach((to, from) => {
  // Reset dependent stores when navigating away from a project to a different project
  if (
    from.name === 'ProjectPage' || 
    from.name === 'ProjectCommitsView' || 
    from.name === 'ProjectFileTreeView'
  ) {
    const fromProjectId = Array.isArray(from.params.projectIdentifier) 
      ? from.params.projectIdentifier[0] 
      : from.params.projectIdentifier

    const toProjectId = Array.isArray(to.params.projectIdentifier) 
      ? to.params.projectIdentifier[0] 
      : to.params.projectIdentifier

    // Only reset if we're navigating to a different project or away from projects entirely
    if (fromProjectId && fromProjectId !== toProjectId) {
      const commitStore = useCommitStore()
      const aiResponseStore = useAiResponseStore()
      
      commitStore.$reset()
      aiResponseStore.resetAiState()
    }
  }
})

export default router
