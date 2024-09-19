import { createRouter, createWebHistory } from "vue-router"
import DashboardView from "./views/DashboardView.vue"
import LoginView from "./views/LoginView.vue"
import PerformancesView from "./views/PerformancesView.vue"
import TracksView from "./views/TracksView.vue"

const routes = [
  { path: "/", component: DashboardView },
  { path: "/login", component: LoginView },
  { path: "/performances", component: PerformancesView },
  { path: "/tracks", component: TracksView },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
