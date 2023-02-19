import { createRouter, createWebHistory } from '@ionic/vue-router'
import { RouteRecordRaw } from 'vue-router'
import MainPage from '../views/MainPage.vue'
import QrScannerPage from '../views/QrScannerPage.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/qr-scanner'
  },
  {
    path: '/main',
    name: 'Main',
    component: MainPage
  },
  {
    path: '/qr-scanner',
    name: 'QrScanner',
    component: QrScannerPage
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
