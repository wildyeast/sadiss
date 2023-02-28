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
import { IonContent, IonPage, IonButton, useIonRouter } from '@ionic/vue'
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
    const result: QrCodeScanResult = await JSON.parse(resultJson)

    // Performance name
    const performanceName = result.performanceName
    if (performanceName) {
      await Preferences.set({
        key: 'performanceName',
        value: performanceName
      })
    }

    // ChoirId (id of Role)
    const choirId = result.choirId
    if (choirId && !Number.isNaN(+choirId)) {
      await Preferences.set({
        key: 'choirId',
        value: String(choirId)
      })
    }

    // Role Name
    const roleName = result.roleName
    if (roleName) {
      await Preferences.set({
        key: 'roleName',
        value: roleName
      })
    }

    // TTS langs
    if (result.tts) {
      await Preferences.set({
        key: 'availableLanguages',
        value: JSON.stringify(result.tts)
      })
      ionRouter.navigate('/language-selection', 'forward', 'push')
    } else {
      ionRouter.navigate('/main', 'forward', 'push')
    }

    // Default TTS lang
    const defaultLang = result.defaultLang
    if (defaultLang) {
      await Preferences.set({
        key: 'defaultLang',
        value: defaultLang
      })
    }

    // Export Mode
    // TODO Not yet implemented
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

interface QrCodeScanResult {
  performanceName: string
  choirId?: number
  tts?: boolean
  roleName?: string
  defaultLang?: string
}
</script>
