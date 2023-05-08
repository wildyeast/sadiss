<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <BasePage>
        <div class="flex flex-1 flex-col items-center justify-around">
          <p>To join the performance please scan a QR code at the venue using the button below.</p>
          <ion-button
            v-if="!mainStore.processing"
            @click="scanCode"
            class="ionic-rounded-full h-[60vw] w-[60vw] rounded-full border-2 border-highlight text-3xl uppercase">
            Scan<br />QR<br />
            code
          </ion-button>
          <div v-if="!mainStore.processing">
            <p class="text-sm leading-4">
              Once registered you will have to quit and re-start the app to leave the performance or scan a different code.
            </p>
          </div>
        </div>
        <p class="text-center text-sm">
          Visit
          <a
            href="https://sadiss.net"
            class="text-highlight"
            >sadiss.net
          </a>
          for more information on the software system.
        </p>
        <div
          v-if="mainStore.processing"
          class="flex h-full items-center justify-center">
          <ion-spinner
            name="circular"
            class="scale-[200%] text-highlight" />
        </div>
      </BasePage>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonPage, IonButton, useIonRouter, IonSpinner } from '@ionic/vue'
import { onDeactivated } from 'vue'
import BasePage from '@/components/BasePage.vue'
import { useBarcodeScanner } from '@/composables/useBarcodeScanner'
import { QrCodeScanResult } from '@/types/types'
import { useMainStore } from '@/stores/MainStore'
import { usePlayer } from '@/composables/usePlayer'

const ionRouter = useIonRouter()
const mainStore = useMainStore()
const { startAudioCtx } = usePlayer()

/* QR Code Scanning */
const { startScan, stopScan, processScanResult } = useBarcodeScanner()

const scanCode = async () => {
  // Start audioCtx on first user interaction
  startAudioCtx()

  // Make camera visible and everything else invisible in app viewport, classes defined in App.vue
  document.body.classList.add('qrscanner')

  mainStore.processing = true
  const resultJson = await startScan()

  if (resultJson) {
    let result: QrCodeScanResult
    try {
      result = await JSON.parse(resultJson)
    } catch (err) {
      alert('Scan failed. Please try again.')
      stopScanning()
      mainStore.processing = false
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
  } else if (!mainStore.availableLanguages.length || mainStore.availableLanguages.length === 1) {
    ionRouter.navigate('/main', 'forward', 'push')
  } else {
    ionRouter.navigate('/language-selection', 'forward', 'push')
  }
}

const stopScanning = () => {
  stopScan()
  // Make camera invisible, and everything else visible
  document.body.classList.remove('qrscanner')
}

onDeactivated(() => {
  document.body.classList.remove('qrscanner')
  stopScan()
})
</script>
