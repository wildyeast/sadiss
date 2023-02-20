<template>
  <ion-app class="scanner-hide">
    <ion-router-outlet />
  </ion-app>
  <div class="scanner-ui justify-center">
    <!-- QR Scanner Interface -->
    <ion-button
      @click="stopScanning"
      class="ionic-bg-secondary absolute bottom-2 font-bold text-white">
      Go back
    </ion-button>
  </div>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet, IonButton, IonHeader, IonToolbar, IonButtons, IonBackButton } from '@ionic/vue'
import { useBarcodeScanner } from './composables/useBarcodeScanner'

const { stopScan } = useBarcodeScanner()

const stopScanning = () => {
  stopScan()
  // Make camera invisible, and everything else visible
  document.body.classList.remove('qrscanner')
}
</script>

<style>
body,
html,
ion-toolbar {
  --background: #111;
  --ion-background-color: #111;
  @apply bg-primary;
}

body.scanner-active {
  --background: transparent;
  --ion-background-color: transparent;
}

.scanner-ui {
  display: none;
}

.scanner-hide {
  visibility: visible;
}

body.qrscanner {
  background-color: transparent;
}

body.qrscanner .scanner-ui {
  display: flex;
}

body.qrscanner .scanner-hide {
  visibility: hidden;
}
</style>
