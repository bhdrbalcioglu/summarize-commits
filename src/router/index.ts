import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import GitLabCallbackView from '../views/GitlabCallbackView.vue'
import GroupsView from '../views/GroupsView.vue'
import ProjectsView from '../views/ProjectsView.vue'
import HomeView from '../views/HomeView.vue'
import UserView from '../views/UserView.vue'
import ProjectPageView from '../views/ProjectPageView.vue'
import CommitSummariesView from '../views/CommitSummariesView.vue'
import FileTreeView from '../views/FileTreeView.vue'
import CommitsView from '../views/CommitsView.vue'
import { useAuthStore } from '../stores/auth'
import { useUserStore } from '../stores/user'
const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: HomeView
  },
  {
    path: '/oauth/gitlab/callback',
    name: 'GitLabCallback',
    component: GitLabCallbackView
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
    path: '/projects/:name',
    name: 'ProjectPage',
    component: ProjectPageView,
    props: true,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'commits',
        name: 'CommitsView',
        component: CommitsView
      },
      {
        path: 'file-tree',
        name: 'FileTreeView',
        component: FileTreeView
      }
    ]
  },
  {
    path: '/commit-summaries',
    name: 'CommitSummaries',
    component: CommitSummariesView,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const userStore = useUserStore()
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    next({ name: 'Home' })
    userStore.clearUser()
  } else {
    next()
  }
})

export default router
