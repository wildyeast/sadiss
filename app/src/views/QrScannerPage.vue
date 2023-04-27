<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <BasePage>
        <div
          v-if="nextPerformance"
          class="w-full border-b pb-4">
          <div v-html="nextPerformance" />
        </div>
        <ion-button
          v-if="!processing"
          @click="scanCode"
          class="button ionic-border-highlight-narrow h-[80px] w-full text-3xl">
          Scan QR code
        </ion-button>
        <div v-if="!processing">
          <p class="text-sm">
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
import { ref, onMounted, computed } from 'vue'
import { IonContent, IonPage, IonButton, useIonRouter, IonSpinner } from '@ionic/vue'
import { onDeactivated } from 'vue'
import BasePage from '@/components/BasePage.vue'
import { useBarcodeScanner } from '@/composables/useBarcodeScanner'
import { AvailableLanguage } from '@/types/types'
import { useMainStore } from '@/stores/MainStore'
import { usePlayer } from '@/composables/usePlayer'

const ionRouter = useIonRouter()
const mainStore = useMainStore()
const { startAudioCtx } = usePlayer()

const upcomingPerformances = ref([])

const nextPerformance = computed<string>(() => {
  return '<h2 class="font-bold">Next Performance</h2><h1 class="text-2xl">Naming Names</h1><p>Beta-test for a piece for no audience by Simon Lee, Eve Sussman, Volkmar Klien.<p>Saturday, April 15, 7:00-9:00pm<br>Crown Heights, Brooklyn</p></p><a class="text-highlight text-sm" href="http://devropa.com">More information about the piece ></a>'
  // return upcomingPerformances.value[0]
})

const getPerformances = async () => {
  try {
    const res = await fetch('https://sadiss.net/server/get-performances')
    const data = await res.json()
    upcomingPerformances.value = data
  } catch (err) {
    console.log('Failed to get performances.', err)
  }
}

/* QR Code Scanning */

const { startScan, stopScan } = useBarcodeScanner()

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
      return
    }

    // Performance name
    const performanceNameResult = result.performanceName
    if (performanceNameResult) {
      mainStore.performanceName = performanceNameResult
    }

    // ChoirId (id of Role)
    const choirIdResult = result.choirId
    if (choirIdResult !== undefined && !Number.isNaN(+choirIdResult)) {
      mainStore.choirId = choirIdResult
    }
    // Role Name
    const roleNameResult = result.roleName
    if (roleNameResult) {
      mainStore.roleName = roleNameResult
    }

    // Default TTS lang
    const defaultLangResult = result.defaultLang
    if (defaultLangResult) {
      mainStore.defaultLang = JSON.parse(defaultLangResult)
    }

    // Timestamp of scan
    // await setPreference('lastScanTimestamp', Date.now().toString())

    // TTS langs
    const ttsLangsResult = result.tts
    if (ttsLangsResult) {
      mainStore.selectedLanguage = ttsLangsResult[0].iso
      mainStore.availableLanguages = ttsLangsResult
    }

    // Expert Mode and navigation
    const expertModeResult = result.expertMode
    if (expertModeResult) {
      mainStore.expertMode = expertModeResult
      ionRouter.navigate('/offset-calibration', 'forward', 'push')
    } else if (ttsLangsResult) {
      if (ttsLangsResult.length === 1) {
        ionRouter.navigate('/main', 'forward', 'push')
      } else {
        ionRouter.navigate('/language-selection', 'forward', 'push')
      }
    } else {
      ionRouter.navigate('/main', 'forward', 'push')
    }
  }
  stopScanning()
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

interface Performance {
  name: string
  artist: string
  location: string
  url: string
  date: string
}

interface QrCodeScanResult {
  performanceName: string
  choirId?: number
  tts?: AvailableLanguage[]
  roleName?: string
  defaultLang?: string
  expertMode?: boolean
}
</script>
