import { createRouter, createWebHistory } from "vue-router"
import DashboardView from "./DashboardView.vue"
import PerformancesView from "./PerformancesView.vue"
import TracksView from "./TracksView.vue"

const routes = [
  { path: "/", component: DashboardView },
  { path: "/performances", component: PerformancesView },
  { path: "/tracks", component: TracksView },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
