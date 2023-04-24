<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="flex min-h-full w-full flex-col items-center justify-between overflow-scroll bg-primary p-4 px-6">
        <div class="flex flex-col items-center">
          <img
            src="../../public/assets/sadiss-logo.png"
            class="my-8 w-1/2" />
          <div
            v-if="nextPerformance"
            class="w-full border-b pb-4">
            <div v-html="nextPerformance" />
          </div>
        </div>
        <ion-button
          @click="scanCode"
          class="button w-full text-3xl">
          Scan QR code
        </ion-button>
        <div>
          <p class="text-sm">
            To join the performance please scan a QR code at the venue using the button above.<br />
            Once registered you will have to quit and re-start the app to leave the performance or scan a different code.
          </p>
          <p class="mt-10 text-center">
            Visit
            <a
              href="https://sadiss.net"
              class="text-highlight"
              >sadiss.net</a
            >
            for more information on the software system.
          </p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { IonContent, IonPage, IonButton, useIonRouter } from '@ionic/vue'
import { onDeactivated } from 'vue'
import { useBarcodeScanner } from '@/composables/useBarcodeScanner'
import { setPreference } from '@/tools/preferences'

// Router
const ionRouter = useIonRouter()

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
const scanCode = async () => {
  // Make camera visible and everything else invisible in app viewport, classes defined in App.vue
  document.body.classList.add('qrscanner')
  const resultJson = await startScan()
  if (resultJson) {
    let result: QrCodeScanResult
    try {
      result = await JSON.parse(resultJson)
    } catch (err) {
      alert('Scan failed. Please try again.')
      stopScanning()
      return
    }

    // Performance name
    const performanceName = result.performanceName
    if (performanceName) {
      await setPreference('performanceName', performanceName)
    }

    // ChoirId (id of Role)
    const choirId = result.choirId
    if (choirId !== undefined && !Number.isNaN(+choirId)) {
      await setPreference('choirId', String(choirId))
    }
    // Role Name
    const roleName = result.roleName
    if (roleName) {
      await setPreference('roleName', roleName)
    }

    // Default TTS lang
    const defaultLang = result.defaultLang
    if (defaultLang) {
      await setPreference('defaultLang', defaultLang)
    }

    // Timestamp of scan
    await setPreference('lastScanTimestamp', Date.now().toString())

    // TTS langs
    const ttsLangs = result.tts
    if (ttsLangs) {
      if (ttsLangs.length === 1) {
        await setPreference('selectedLanguage', ttsLangs[0])
      } else {
        await setPreference('availableLanguages', JSON.stringify(ttsLangs))
      }
    }

    // Expert Mode and navigation
    const expertMode = result.expertMode
    if (!expertMode) {
      ionRouter.navigate('/main', 'forward')
    } else if (ttsLangs) {
      if (ttsLangs.length === 1) {
        ionRouter.navigate('/main', 'forward')
      } else {
        ionRouter.navigate('/language-selection', 'forward')
      }
    } else {
      await setPreference('expertMode', expertMode)
      ionRouter.navigate('/offset-calibration', 'forward')
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
  tts?: string[]
  roleName?: string
  defaultLang?: string
  expertMode?: string
}
</script>
