import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { isUserLoggedIn } from '../services/api'
import { useStore } from '../stores/store'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue')
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../views/RegisterView.vue')
  },
  {
    path: '/performances/:id',
    name: 'performance',
    component: () => import('../views/PerformanceView.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/performances',
    name: 'performances',
    component: () => import('../views/PerformancesView.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/tracks',
    name: 'tracks',
    component: () => import('../views/TracksView.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/:catchAll(.*)',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Before each route, check if the user is logged in
router.beforeEach(async (to, from, next) => {
  const user = await isUserLoggedIn()
  if (user) {
    const store = useStore()
    store.userName = user!.username
  }

  if (to.matched.some((record) => record.meta.requiresAuth) && !user) {
    next('/login')
  } else {
    next()
  }
})

export default router
