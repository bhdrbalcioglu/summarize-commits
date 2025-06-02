// frontend/src/router/index.ts
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import HomeView from '../views/HomeView.vue'
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
    meta: { requiresAuth: false } // Allow both guest and authenticated users
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { requiresAuth: false, guestOnly: true }
  },
  // OAuth Callback Route for Supabase Auth
  {
    path: '/auth/callback',
    name: 'AuthCallback',
    component: () => import('../views/OAuthCallback.vue'),
    meta: { requiresAuth: false }
  },

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

      const projectIdentifier = Array.isArray(to.params.projectIdentifier) ? to.params.projectIdentifier[0] : to.params.projectIdentifier

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

  // Quick guard exit for same route navigation (performance optimization)
  // BUT allow auth checks for home page to ensure proper button state
  if (to.fullPath === from.fullPath && to.name !== 'Home') {
    console.log(`🛣️ [ROUTER GUARD] Same route navigation detected, skipping guard`)
    return next()
  }

  console.log(`🛣️ [ROUTER GUARD] Navigation: ${String(from.name) || from.path} → ${String(to.name) || to.path}`)
  console.log(`🛣️ [ROUTER GUARD] Route meta:`, {
    requiresAuth: to.meta.requiresAuth,
    guestOnly: to.meta.guestOnly
  })
  console.log(`🛣️ [ROUTER GUARD] Auth state:`, {
    isAuthenticated: authStore.isUserAuthenticated,
    isLoading: authStore.isLoading,
    hasUser: !!authStore.user
  })

  // Skip auth checks for the callback route as it handles its own authentication
  if (to.name === 'AuthCallback') {
    console.log(`🛣️ [ROUTER GUARD] Auth callback route detected, skipping auth checks`)
    next()
    return
  }

  // Initialize auth only if we haven't tried yet and user is not authenticated
  if (!authStore.user && !authStore.isLoading && !authStore._hasTriedFetchingUser) {
    console.log(`🛣️ [ROUTER GUARD] No user data and haven't tried fetching yet, initializing auth...`)
    await authStore.initializeAuth()
    console.log(`🛣️ [ROUTER GUARD] Auth initialization complete. New state:`, {
      isAuthenticated: authStore.isUserAuthenticated,
      hasUser: !!authStore.user
    })
  } else {
    console.log(`🛣️ [ROUTER GUARD] Auth already attempted or user exists, skipping init`)
  }

  const requiresAuth = to.meta.requiresAuth
  const guestOnly = to.meta.guestOnly // For routes like login/home that authed users should skip

  if (requiresAuth && !authStore.isUserAuthenticated) {
    console.log(`🛣️ [ROUTER GUARD] Route requires auth but user not authenticated, redirecting to login`)
    // If route requires auth and user is not authenticated, redirect to login page
    next({ name: 'Login', query: { redirect: to.fullPath } }) // Save redirect path
  } else if (guestOnly && authStore.isUserAuthenticated) {
    console.log(`🛣️ [ROUTER GUARD] Guest-only route but user authenticated, redirecting to user page`)
    // If route is for guests only (like Home/Login page) and user IS authenticated,
    // redirect to the User page regardless of provider.
    next({ name: 'User' })
  } else {
    console.log(`🛣️ [ROUTER GUARD] Navigation allowed, proceeding to ${String(to.name) || to.path}`)
    next()
  }
})

// Global afterEach hook for store cleanup
router.afterEach((to, from) => {
  // Reset dependent stores when navigating away from a project to a different project
  if (from.name === 'ProjectPage' || from.name === 'ProjectCommitsView' || from.name === 'ProjectFileTreeView') {
    const fromProjectId = Array.isArray(from.params.projectIdentifier) ? from.params.projectIdentifier[0] : from.params.projectIdentifier

    const toProjectId = Array.isArray(to.params.projectIdentifier) ? to.params.projectIdentifier[0] : to.params.projectIdentifier

    // Only reset if we're navigating to a different project or away from projects entirely
    // BUT NOT when going to CommitSummaries (which displays AI results)
    if (fromProjectId && fromProjectId !== toProjectId && to.name !== 'CommitSummaries') {
      const commitStore = useCommitStore()
      const aiResponseStore = useAiResponseStore()

      commitStore.$reset()
      aiResponseStore.resetAiState()
    }
  }
})

export default router
