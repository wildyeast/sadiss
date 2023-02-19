<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>SADISS</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="flex h-full w-full items-center justify-center">
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
import { Storage } from '@ionic/storage'

// Router
const ionRouter = useIonRouter()

// Init storage
const store = new Storage()

const { startScan, stopScan } = useBarcodeScanner()

const scanCode = async () => {
  // Make camera visible and everything else invisible in app viewport, classes defined in App.vue
  document.body.classList.add('qrscanner')
  const result = await startScan()
  if (result && !Number.isNaN(+result)) {
    await store.set('choirId', +result)
    stopScanning()
    ionRouter.navigate('/MainPage', 'forward', 'replace')
  } else {
    stopScanning()
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
