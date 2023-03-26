<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="flex min-h-full w-full flex-col items-center justify-between overflow-scroll bg-primary p-4 px-6">
        <div class="flex flex-col items-center">
          <img
            src="../../public/assets/sadiss-logo.png"
            class="my-8 w-3/5" />
          <div
            v-if="nextPerformance"
            class="border border-[#f5a700] px-6 pb-6 text-lg text-[#f5a700]">
            <h2 class="pt-2 pb-4 text-xl">Next performance</h2>
            <h3 class="text-2xl uppercase">{{ nextPerformance.name }}</h3>
            <p>{{ nextPerformance.location }}</p>
            <!-- <p>Artist: {{ nextPerformance.artist }}</p> -->
            <p>{{ new Date(nextPerformance.date).toLocaleDateString() }}</p>
            <a :href="nextPerformance.url">[<span class="underline">open webpage</span>]</a>
          </div>
        </div>
        <ion-button
          @click="scanCode"
          class="ionic-bg-secondary my-6 h-[60px] font-bold">
          Scan QR code
        </ion-button>
        <div class="text-lg text-white">
          <p>
            SADISS bundles phones of the audience into a massive, intricate sound system with numerous distinct sound sources
            scattered throughout the space.<br /><br />
            Physical presence is required at a performance venue. To participate, scan the QR code provided at the venue.<br /><br />
            Visit
            <a
              class="text-[#f5a700]"
              href="https://sadiss.net">
              <u>sadiss.net</u>
            </a>
            for more information!
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
import { getPreference, setPreference } from '@/tools/preferences'

// Router
const ionRouter = useIonRouter()

const upcomingPerformances = ref([])

const nextPerformance = computed<{ name: string; artist: string; location: string; url: string; date: string }>(() => {
  return upcomingPerformances.value[0]
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
    if (choirId && !Number.isNaN(+choirId)) {
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

    // Export Mode
    // TODO Not yet implemented

    // Timestamp of scan
    await setPreference('lastScanTimestamp', Date.now().toString())

    // TTS langs
    if (result.tts) {
      await setPreference('availableLanguages', JSON.stringify(result.tts))
      ionRouter.navigate('/language-selection', 'forward', 'push')
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
  const INVALIDATE_SCAN_AFTER_MS = 1000 * 60 * 90 // 90 Minutes
  const qrCodeInvalidationCheckedThisSession = await getPreference('qrCodeInvalidationCheckedThisSession')
  const lastScanTimestamp = await getPreference('lastScanTimestamp')
  if (
    qrCodeInvalidationCheckedThisSession.value === 'false' &&
    lastScanTimestamp.value &&
    +lastScanTimestamp.value + INVALIDATE_SCAN_AFTER_MS > Date.now()
  ) {
    // Skip scanning requirement if app has just started and last scan less than INVALIDATE_SCAN_AFTER_MS milliseconds ago
    await setPreference('qrCodeInvalidationCheckedThisSession', 'true')
    ionRouter.navigate('/main', 'root', 'replace')
    return
  } else {
    await setPreference('qrCodeInvalidationCheckedThisSession', 'false')
    getPerformances()
  }
})

onDeactivated(() => {
  document.body.classList.remove('qrscanner')
  stopScan()
})

interface QrCodeScanResult {
  performanceName: string
  choirId?: number
  tts?: boolean
  roleName?: string
  defaultLang?: string
}
</script>
