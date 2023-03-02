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
        <div class="text-lg text-white">
          <p class="mb-2">
            SADISS bundles phones of the audience into a massive, intricate sound system with numerous distinct sound sources
            scattered throughout the space.<br /><br />
            Physical presence is required at a performance venue. To participate, scan the QR code provided at the venue.
          </p>
        </div>
        <ion-button
          @click="scanCode"
          class="ionic-bg-secondary h-[60px] font-bold">
          Scan QR code
        </ion-button>
        <p class="text-white">
          Visit
          <a
            class="text-[#f5a700]"
            href="https://sadiss.net">
            <u>sadiss.net</u>
          </a>
          for more information!
        </p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { IonContent, IonPage, IonButton, useIonRouter } from '@ionic/vue'
import { onDeactivated } from 'vue'
import { useBarcodeScanner } from '@/composables/useBarcodeScanner'
import { Preferences } from '@capacitor/preferences'

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
    const result: { choirId: number; tts?: boolean } = await JSON.parse(resultJson)

    const choirId = result.choirId
    if (choirId && !Number.isNaN(+choirId)) {
      await Preferences.set({
        key: 'choirId',
        value: String(choirId)
      })
    }

    if (result.tts) {
      await Preferences.set({
        key: 'availableLanguages',
        value: JSON.stringify(result.tts)
      })
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
  getPerformances()
})

onDeactivated(() => {
  document.body.classList.remove('qrscanner')
  stopScan()
})
</script>
