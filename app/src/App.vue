<template>
  <ion-app class="scanner-hide">
    <ion-router-outlet />
  </ion-app>
  <div class="scanner-ui justify-center">
    <!-- QR Scanner Interface -->
    <ion-button
      @click="stopScanning"
      class="button absolute bottom-2">
      Go back
    </ion-button>
  </div>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet, IonButton } from '@ionic/vue'
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
  --background: #3e5b53;
  --ion-background-color: #3e5b53;
  @apply bg-primary;
}

ion-button {
  --background-hover: #253833;
  --background-activated: #253833;
  --background-focused: #253833;
}

ion-back-button {
  --color: white !important;
}

/* QR Code Scanning */

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
