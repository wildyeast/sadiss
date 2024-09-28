import { createRouter, createWebHistory } from "vue-router"
import DashboardView from "./views/DashboardView.vue"
import LoginView from "./views/LoginView.vue"
import PerformancesView from "./views/PerformancesView.vue"
import PerformanceDetailView from "./views/PerformanceDetailView.vue"
import TracksView from "./views/TracksView.vue"
import { isUserLoggedIn } from "./api/authService"
import AddTrackView from "./views/AddTrackView.vue"
import AddPerformanceView from "./views/AddPerformanceView.vue"
import AddTracksToPerformanceView from "./views/AddTracksToPerformanceView.vue"
import ProfileView from "./views/ProfileView.vue"
import { useUserStore } from "./stores/useUserStore"
import CreateQrCodesView from "./views/CreateQrCodesView.vue"

const routes = [
  {
    path: "/",
    name: "Dashboard",
    component: DashboardView,
    meta: { requiresAuth: true },
  },
  {
    path: "/user",
    name: "User",
    component: ProfileView,
    meta: { requiresAuth: true },
  },
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
    path: "/performances/new",
    name: "AddPerformance",
    component: AddPerformanceView,
    meta: { requiresAuth: true },
  },
  {
    path: "/performance/:performanceId",
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
  {
    path: "/tracks/new",
    name: "AddTrack",
    component: AddTrackView,
    meta: { requiresAuth: true },
  },
  {
    path: "/performance/:performanceId/add-tracks",
    name: "AddTracksToPerformance",
    component: AddTracksToPerformanceView,
    meta: { requiresAuth: true },
    props: true,
  },
  {
    path: "/performance/:performanceId/create-qr-codes",
    name: "CreateQrCodes",
    component: CreateQrCodesView,
    meta: { requiresAuth: true },
    props: true,
  },
  {
    path: "/:catchAll(.*)",
    redirect: "/",
  },
]

const router = createRouter({
  history: createWebHistory("/admin"),
  routes,
})

router.beforeEach(async (to, _from, next) => {
  const userStore = useUserStore()
  const userId = await isUserLoggedIn()
  if (userId) {
    userStore.loggedInUserId = userId
  } else {
    userStore.loggedInUserId = null
  }

  if (to.matched.some(record => record.meta.requiresAuth) && !userId) {
    next("/login")
  } else {
    if (to.name === "Login" && userId) {
      next("/dashboard")
    } else {
      next()
    }
  }
})

router.afterEach((_to, _from) => {
  window.scrollTo(0, 0)
})

export default router
