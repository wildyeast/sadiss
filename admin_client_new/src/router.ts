import { createRouter, createWebHistory } from "vue-router"
import DashboardView from "./views/DashboardView.vue"
import LoginView from "./views/LoginView.vue"
import PerformancesView from "./views/PerformancesView.vue"
import PerformanceDetailView from "./views/PerformanceDetailView.vue"
import TracksView from "./views/TracksView.vue"

const routes = [
  { path: "/", name: "Dashboard", component: DashboardView },
  {
    path: "/login",
    name: "Login",
    component: LoginView,
    meta: { hideNavbar: true },
  },
  { path: "/performances", name: "Performances", component: PerformancesView },
  {
    path: "/performance/:id",
    name: "PerformanceDetail",
    component: PerformanceDetailView,
    props: true,
  },
  { path: "/tracks", name: "Tracks", component: TracksView },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
