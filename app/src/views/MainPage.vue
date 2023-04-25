<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button :hidden="isRegistered"></ion-back-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="flex h-full flex-col items-center justify-between overflow-y-scroll bg-primary">
        <div class="flex flex-col items-center gap-4 pt-10 text-white">
          <h1 class="text-3xl">{{ mainStore.performanceName }}</h1>
          <h2 class="text-2xl">{{ mainStore.roleName }}</h2>
        </div>

        <ion-button @click="register">
          class="ionic-rounded-full ionic-bg-secondary h-[60vw] w-[60vw] text-2xl font-bold" :class="{ 'ionic-border-highlight
          text-highlight': isRegistered }">
          {{ isRegistered ? 'Registered' : 'Register' }}
        </ion-button>
        <div>
          <ion-button
            @click="ionRouter.navigate('/qr-scanner', 'root')"
            :disabled="isRegistered"
            class="ionic-bg-secondary mt-4 h-[60px] font-bold">
            Re-Scan<br />QR-Code
          </ion-button>
          <ion-button
            v-if="mainStore.expertMode"
            @click="ionRouter.navigate('/offset-calibration', 'forward', 'push')"
            class="ionic-bg-secondary mt-4 h-[60px] font-bold">
            Calibrate<br />Output Latency
          </ion-button>
        </div>

        <p class="text-white">v1.1.0</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonHeader, IonPage, IonToolbar, IonButton, IonButtons, IonBackButton, useIonRouter } from '@ionic/vue'
import { ref, watch, reactive, onUnmounted } from 'vue'
import { usePlayer } from '../composables/usePlayer'
import { Capacitor } from '@capacitor/core'
import { KeepAwake } from '@capacitor-community/keep-awake'
import { NavigationBar } from '@hugotomazi/capacitor-navigation-bar'
import { useMainStore } from '@/stores/MainStore'
const mainStore = useMainStore()

// Router
const ionRouter = useIonRouter()

// 'env'

const VUE_APP_WS_SERVER_URL = '192.168.0.87'
const VUE_APP_WS_SERVER_PORT = '443'

const VUE_APP_WS_LIVE_SERVER_URL = 'wss://sadiss.net/ws/'

const isRegistered = ref(false)
const ws = ref<WebSocket>()

const { handleChunkData, setStartTime, setTtsLanguage, setTrackSettings, stopPlayback, setOffset } = usePlayer()

let attemptingToRegister = false
const register = () => {
  if (attemptingToRegister || isRegistered.value) return
  attemptingToRegister = true
  setTtsLanguage(mainStore.selectedLanguage)

  establishWebsocketConnection()
}

const establishWebsocketConnection = () => {
  // ws.value = new WebSocket(`ws://${VUE_APP_WS_SERVER_URL}:${VUE_APP_WS_SERVER_PORT}`)
  ws.value = new WebSocket(VUE_APP_WS_LIVE_SERVER_URL)

  ws.value.onopen = function () {
    isRegistered.value = true
    attemptingToRegister = false
    this.send(
      JSON.stringify({
        message: 'clientInfo',
        clientId: mainStore.choirId,
        ttsLang: mainStore.selectedLanguage
      })
    )
  }

  ws.value.onclose = () => {
    isRegistered.value = false
    attemptingToRegister = false
    stopPlayback()
    // Trying to reconnect here while App is in background does not work.
  }

  ws.value.onerror = (error) => {
    isRegistered.value = false
    attemptingToRegister = false
    stopPlayback()
    console.error(error)
  }

  ws.value.onmessage = (event) => {
    if (!event.data) {
      return
    }

    const data = JSON.parse(event.data)
    console.log('\nReceived message: ', Object.keys(data))

    if (data.start) {
      setOffset()
    }

    if (data.stop) {
      stopPlayback()
      return
    }

    // TODO: This is not ideal, we shouldn't set globalStartTime every time we receive data
    // Is there a way around it though? Clients can join late. Do they need this information?
    setStartTime(data.startTime)
    setTrackSettings(data.waveform, data.ttsRate)
    if (Object.keys(data.chunk)) {
      handleChunkData(data.chunk)
    }
  }
}

onUnmounted(async () => {
  ws.value?.close()
  if (Capacitor.getPlatform() === 'android') {
    await NavigationBar.show()
  }
})

// Enable/Disable KeepAwake and Android Navigation Bar depending on registration status
watch(
  () => isRegistered.value,
  async (value) => {
    try {
      if (Capacitor.getPlatform() !== 'web') {
        if (value) {
          await KeepAwake.keepAwake()
        } else {
          await KeepAwake.allowSleep()
        }
      }
      if (Capacitor.getPlatform() === 'android') {
        if (value) {
          await NavigationBar.hide()
        } else {
          await NavigationBar.show()
        }
      }
    } catch (error) {
      console.log(error)
    }
  }
)
</script>
