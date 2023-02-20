import { createRouter, createWebHistory } from '@ionic/vue-router'
import { RouteRecordRaw } from 'vue-router'
import MainPage from '../views/MainPage.vue'
import QrScannerPage from '../views/QrScannerPage.vue'
import LanguageSelectionPage from '../views/LanguageSelectionPage.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/qr-scanner'
    // redirect: '/language-selection'
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
  },
  {
    path: '/language-selection',
    name: 'LanguageSelection',
    component: LanguageSelectionPage
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
