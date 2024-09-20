import { createRouter, createWebHistory } from "vue-router"
import DashboardView from "./views/DashboardView.vue"
import LoginView from "./views/LoginView.vue"
import PerformancesView from "./views/PerformancesView.vue"
import PerformanceDetailView from "./views/PerformanceDetailView.vue"
import TracksView from "./views/TracksView.vue"
import { isUserLoggedIn } from "./api/authService"

const routes = [
  { path: "/", name: "Dashboard", component: DashboardView },
  {
    path: "/login",
    name: "Login",
    component: LoginView,
    meta: { hideNavbar: true },
  },
  {
    path: "/performances",
    name: "Performances",
    component: PerformancesView,
    meta: { requiresAuth: true },
  },
  {
    path: "/performance/:id",
    name: "PerformanceDetail",
    component: PerformanceDetailView,
    meta: { requiresAuth: true },
    props: true,
  },
  {
    path: "/tracks",
    name: "Tracks",
    component: TracksView,
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, _from, next) => {
  const user = await isUserLoggedIn()
  // if (user) {
  //   const store = useStore()
  //   store.userName = user!.username
  // }

  if (to.matched.some(record => record.meta.requiresAuth) && !user) {
    next("/login")
  } else {
    if (to.name === "Login" && user) {
      next("/dashboard")
    } else {
      next()
    }
  }
})

export default router
