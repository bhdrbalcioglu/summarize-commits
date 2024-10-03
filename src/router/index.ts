import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import GitLabCallbackView from "../views/GitlabCallbackView.vue";
import GroupsView from "../views/GroupsView.vue";
import ProjectsView from "../views/ProjectsView.vue";
import HomeView from "../views/HomeView.vue";
import UserView from "../views/UserView.vue";
import ProjectPageView from "../views/ProjectPageView.vue";
import CommitSummariesView from "../views/CommitSummariesView.vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "Home",
    component: HomeView,
  },
  {
    path: "/oauth/gitlab/callback",
    name: "GitLabCallback",
    component: GitLabCallbackView,
  },
  
  {
    path: "/groups",
    name: "Groups",
    component: GroupsView,
  },
  {
    path: "/projects",
    name: "ProjectsView",
    component: ProjectsView,
    props: (route) => ({
      groupId: route.query.groupId as string | undefined,
      groupName: route.query.groupName as string | undefined,
    }),
  },

  {
    path: "/user",
    name: "User",
    component: UserView,
  },
  {
    path: "/projects/:name",
    name: "ProjectPage",
    component: ProjectPageView,
    props: true,
  },
  {
    path: "/commit-summaries",
    name: "CommitSummaries",
    component: CommitSummariesView,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
