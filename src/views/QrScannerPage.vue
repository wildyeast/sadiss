<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="flex h-full w-full items-center justify-center bg-primary">
        <ion-button
          @click="scanCode"
          class="ionic-rounded-full ionic-bg-secondary h-[200px] w-[200px] text-2xl">
          Scan<br />QR-Code
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, useIonRouter } from '@ionic/vue'
import { onDeactivated } from 'vue'
import { useBarcodeScanner } from '@/composables/useBarcodeScanner'
import { Preferences } from '@capacitor/preferences'

// Router
const ionRouter = useIonRouter()

const { startScan, stopScan } = useBarcodeScanner()

const scanCode = async () => {
  // Make camera visible and everything else invisible in app viewport, classes defined in App.vue
  document.body.classList.add('qrscanner')
  const resultJson = await startScan()
  if (resultJson) {
    const result: { choirId: number; tts?: boolean } = await JSON.parse(resultJson)

    const choirId = result.choirId
    if (choirId && !Number.isNaN(+choirId)) {
      await Preferences.set({
        key: 'choirId',
        value: String(choirId)
      })
    }

    if (result.tts) {
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

onDeactivated(() => {
  document.body.classList.remove('qrscanner')
  stopScan()
})
</script>
