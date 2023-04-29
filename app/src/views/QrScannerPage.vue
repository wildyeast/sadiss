<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <BasePage>
        <div
          v-if="nextPerformance"
          class="w-full border-b pb-4">
          <p>Next performance</p>
          <h1
            v-html="nextPerformance.name"
            class="text-2xl" />
          <p v-html="nextPerformance.description" />
          <p>{{ new Date(nextPerformance.date).toLocaleDateString() }}</p>
          <p v-html="nextPerformance.location" />
          <a
            :href="nextPerformance.url"
            class="text-highlight"
            >More information about the piece ></a
          >
        </div>
        <ion-button
          v-if="!processing"
          @click="scanCode"
          class="button ionic-border-highlight-narrow h-[80px] w-full text-3xl">
          Scan QR code
        </ion-button>
        <div v-if="!processing">
          <p class="text-sm text-tertiary">
            To join the performance please scan a QR code at the venue using the button above.<br />
            Once registered you will have to quit and re-start the app to leave the performance or scan a different code.
          </p>
          <p class="mt-10 text-center">
            Visit
            <a
              href="https://sadiss.net"
              class="text-highlight"
              >sadiss.net
            </a>
            for more information on the software system.
          </p>
        </div>
        <div
          v-if="processing"
          class="flex h-full items-center justify-center">
          <ion-spinner class="scale-[200%] text-highlight" />
        </div>
      </BasePage>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { IonContent, IonPage, IonButton, useIonRouter, IonSpinner } from '@ionic/vue'
import { onDeactivated } from 'vue'
import BasePage from '@/components/BasePage.vue'
import { useBarcodeScanner } from '@/composables/useBarcodeScanner'
import { QrCodeScanResult } from '@/types/types'
import { useMainStore } from '@/stores/MainStore'
import { usePlayer } from '@/composables/usePlayer'

interface Performance {
  date: string
  description: string
  location: string
  name: string
  url: string
}

const ionRouter = useIonRouter()
const mainStore = useMainStore()
const { startAudioCtx } = usePlayer()

const nextPerformance = ref<Performance | null>()

const getPerformances = async () => {
  try {
    const res = await fetch('https://sadiss.net/server/get-performances')
    const data = await res.json()
    nextPerformance.value = data[0]
  } catch (err) {
    console.log('Failed to get performances.', err)
  }
}

/* QR Code Scanning */

const { startScan, stopScan, processScanResult } = useBarcodeScanner()

const processing = ref(false)

const scanCode = async () => {
  // Start audioCtx on first user interaction
  startAudioCtx()

  // Make camera visible and everything else invisible in app viewport, classes defined in App.vue
  document.body.classList.add('qrscanner')

  const resultJson = await startScan()

  if (resultJson) {
    processing.value = true
    let result: QrCodeScanResult
    try {
      result = await JSON.parse(resultJson)
    } catch (err) {
      alert('Scan failed. Please try again.')
      stopScanning()
      processing.value = false
      return
    }

    processScanResult(result)
    navigateToNextPage()
  }
  stopScanning()
}

const navigateToNextPage = () => {
  if (mainStore.expertMode) {
    ionRouter.navigate('/offset-calibration', 'forward', 'push')
  } else if (mainStore.availableLanguages.length === 1) {
    ionRouter.navigate('/main', 'forward', 'push')
  } else {
    ionRouter.navigate('/language-selection', 'forward', 'push')
  }
  processing.value = false
}

const stopScanning = () => {
  stopScan()
  // Make camera invisible, and everything else visible
  document.body.classList.remove('qrscanner')
}

onMounted(async () => {
  // Currently users need to scan on every app start. To change this, uncomment the code below.
  // Leaving commented code in for now, if we ever decide to add this functionality again.
  // const INVALIDATE_SCAN_AFTER_MS = 1000 * 60 * 90 // 90 Minutes
  // const qrCodeInvalidationCheckedThisSession = await getPreference('qrCodeInvalidationCheckedThisSession')
  // const lastScanTimestamp = await getPreference('lastScanTimestamp')
  // if (
  //   qrCodeInvalidationCheckedThisSession.value === 'false' &&
  //   lastScanTimestamp.value &&
  //   +lastScanTimestamp.value + INVALIDATE_SCAN_AFTER_MS > Date.now()
  // ) {
  //   // Skip scanning requirement if app has just started and last scan less than INVALIDATE_SCAN_AFTER_MS milliseconds ago
  //   await setPreference('qrCodeInvalidationCheckedThisSession', 'true')
  //   ionRouter.navigate('/main', 'root', 'replace')
  //   return
  // } else {
  //   await setPreference('qrCodeInvalidationCheckedThisSession', 'false')
  getPerformances()
  // }
})

onDeactivated(() => {
  document.body.classList.remove('qrscanner')
  stopScan()
  processing.value = false
})
</script>
