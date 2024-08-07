import { createRouter, createWebHistory } from '@ionic/vue-router'
import { RouteRecordRaw } from 'vue-router'
import MainPage from '../views/MainPage.vue'
import QrScannerPage from '../views/QrScannerPage.vue'
import LanguageSelectionPage from '../views/LanguageSelectionPage.vue'
import OffsetCalibrationPage from '@/views/OffsetCalibrationPage.vue'

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
  },
  {
    path: '/language-selection',
    name: 'LanguageSelection',
    component: LanguageSelectionPage
  },
  {
    path: '/offset-calibration',
    name: 'OffsetCalibration',
    component: OffsetCalibrationPage
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
