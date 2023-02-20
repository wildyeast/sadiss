<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button></ion-back-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="flex h-full flex-col items-center justify-center bg-primary">
        <div v-if="debug">
          <div
            v-if="motion && motion.pos"
            class="flex w-[20rem] flex-col items-start">
            <p>ctx Time: {{ debugData.ctxTime }}</p>
            <p>Offset: {{ debugData.offset }}</p>
            <p>Global Time: {{ motion.pos }}</p>
            <p>Calced Global Time: {{ debugData.ctxTime! + debugData.offset }}</p>
            <p>Diff: {{ motion.pos - debugData.offset - debugData.ctxTime! }}</p>
          </div>
        </div>
        <ion-item
          v-if="debug"
          class="ionic-bg-secondary b-0 mb-2 w-[80%] border-0 text-white"
          lines="none">
          <ion-label>Choir ID:</ion-label>
          <ion-input
            type="number"
            v-model.number="choirId" />
        </ion-item>

        <ion-item
          v-if="debug"
          class="ionic-bg-secondary mb-2 w-[80%] text-white"
          lines="none">
          <ion-label>TTS language:</ion-label>
          <ion-select v-model="ttsLanguage">
            <ion-select-option value="en-US">English</ion-select-option>
            <ion-select-option value="de-DE">Deutsch</ion-select-option>
          </ion-select>
        </ion-item>

        <ion-button
          @click="register"
          :disabled="!mcorpConnected"
          class="ionic-rounded-full ionic-bg-secondary h-[160px] w-[160px] text-2xl font-bold"
          :class="{ 'ionic-bg-highlight': isRegistered }">
          {{ isRegistered ? 'Registered' : 'Register' }}
        </ion-button>
        <ion-button
          @click="scanCode"
          class="ionic-bg-secondary mt-4 h-[60px] font-bold"
          :class="{ btn__register_active: isRegistered }">
          Scan<br />QR-Code
        </ion-button>

        <p v-if="debug">v0.0.6</p>
        <p
          v-else
          class="absolute bottom-0">
          v0.0.6
        </p>

        <div
          class="absolute bottom-0 h-[20%] w-full overflow-scroll bg-secondary"
          ref="logContainer"
          v-if="debug">
          <div
            v-for="(log, idx) of logText"
            :key="idx"
            class="flex w-full text-white">
            <span class="min-w-[20%]">{{ log.timestamp }}</span>
            <span class="align-left">{{ log.text }}</span>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonInput,
  IonLabel,
  IonItem,
  IonSelect,
  IonSelectOption,
  IonButtons,
  IonBackButton
} from '@ionic/vue'
import { ref, onMounted, watch, reactive, onDeactivated } from 'vue'
import { usePlayer } from '../composables/usePlayer'
import { useBarcodeScanner } from '@/composables/useBarcodeScanner'
import { Capacitor } from '@capacitor/core'
import { KeepAwake } from '@capacitor-community/keep-awake'
import { Preferences } from '@capacitor/preferences'

// Development mode
const debug = false

// 'env'
const VUE_APP_MCORP_API_KEY = '8844095860530063641'

const VUE_APP_WS_SERVER_URL = '192.168.0.87'
const VUE_APP_WS_SERVER_PORT = '443'

const VUE_APP_WS_LIVE_SERVER_URL = 'wss://sadiss.net/ws/'

const isRegistered = ref(false)
const ws = ref<WebSocket>()

const choirId = ref(1)
const ttsLanguage = ref('en-US')

const {
  handleChunkData,
  startAudioCtx,
  setStartTime,
  setLogFunction,
  setTtsLanguage,
  setMotionRef,
  setTrackSettings,
  getDebugData,
  stopPlayback,
  playContinuousSound,
  stopContinuousSound,
  setOffset
} = usePlayer()

const debugData = ref<{ ctxTime: number | undefined; offset: number }>({
  ctxTime: -1,
  offset: -1
})

if (debug) {
  setInterval(() => {
    debugData.value = getDebugData()
  }, 50)
}

const { startScan, stopScan } = useBarcodeScanner()

const register = () => {
  if (isRegistered.value) return
  startAudioCtx()
  setTtsLanguage(ttsLanguage.value)
  dLog('Audio ctx started.')

  establishWebsocketConnection()
}

const establishWebsocketConnection = () => {
  // ws.value = new WebSocket(`ws://${VUE_APP_WS_SERVER_URL}:${VUE_APP_WS_SERVER_PORT}`)
  ws.value = new WebSocket(VUE_APP_WS_LIVE_SERVER_URL)

  ws.value.onopen = function () {
    dLog('Websocket connection opened.')
    isRegistered.value = true
    this.send(
      JSON.stringify({
        message: 'clientInfo',
        clientId: choirId.value,
        ttsLang: ttsLanguage.value
      })
    )
  }

  ws.value.onclose = () => {
    dLog('Websocket connection closed.')
    isRegistered.value = false
    stopPlayback()
    // Trying to reconnect here while App is in background does not work.
  }

  ws.value.onerror = (error) => {
    isRegistered.value = false
    console.error(error)
    stopPlayback()
  }

  ws.value.onmessage = (event) => {
    if (!event.data) {
      dLog('Keep Alive Message received.')
      return
    }

    const data = JSON.parse(event.data)
    console.log('\nReceived message: ', Object.keys(data))

    if (data.start) {
      dLog('Initial setting of offset.')
      setOffset()
    }

    if (data.stop) {
      dLog('Track stopped.')
      stopPlayback()
      return
    }

    // TODO: This is not ideal, we shouldn't set globalStartTime every time we receive data
    // Is there a way around it though? Clients can join late. Do they need this information?
    setStartTime(data.startTime)
    setTrackSettings(data.waveform, data.ttsRate)
    if (Object.keys(data.chunk)) {
      if (data.chunk.partials) {
        dLog(
          'Partials: ' +
            data.chunk.partials
              .map((el: any) => el.index)
              .sort((a: number, b: number) => a - b)
              .join(', ')
        )
      }
      if (data.chunk.ttsInstructions) {
        dLog('TTS: ' + data.chunk.ttsInstructions)
      }
      handleChunkData(data.chunk)
    }
  }
}

let motion: any
const mcorpConnected = ref(false)
const initializeMCorp = async () => {
  // @ts-expect-error: Can't find name MCorp, which is added via <script> in index.html
  // eslint-disable-next-line
  const mCorpApp = MCorp.app(VUE_APP_MCORP_API_KEY, { anon: true })
  mCorpApp.run = () => {
    motion = reactive(mCorpApp.motions['shared'])
    mcorpConnected.value = true
    setMotionRef(motion)
  }
  mCorpApp.init()
}

const scanCode = async () => {
  // Make camera visible and everything else invisible in app viewport, classes defined in App.vue
  document.body.classList.add('qrscanner')
  const result = await startScan()
  // TODO: Result is being cast twice here, don't do this.
  dLog('QR scan result: ' + result)
  if (result && !Number.isNaN(+result)) {
    choirId.value = +result
  }
  // Make camera invisible, and everything else visible
  document.body.classList.remove('qrscanner')
}

onMounted(async () => {
  const choirIdResult = await Preferences.get({ key: 'choirId' })
  if (choirIdResult.value) {
    choirId.value = +choirIdResult.value
  }

  const langResult = await Preferences.get({ key: 'lang' })
  if (langResult.value) {
    ttsLanguage.value = langResult.value
  }

  await initializeMCorp()
})

const logContainer = ref<HTMLDivElement | null>(null)
const logText = ref<{ text: string; timestamp: string }[]>([
  { text: 'test', timestamp: 'test' },
  { text: 'test', timestamp: 'test' },
  { text: 'test', timestamp: 'test' },
  { text: 'test', timestamp: 'test' },
  { text: 'test', timestamp: 'test' },
  { text: 'test', timestamp: 'test' },
  { text: 'test', timestamp: 'test' },
  { text: 'test', timestamp: 'test' },
  { text: 'test', timestamp: 'test' },
  { text: 'test', timestamp: 'test' },
  { text: 'test', timestamp: 'test' }
])
/**
 * Prints the given string to the on-screen log.
 * @param string text - String to print to log.
 */
const dLog = (text: string) => {
  console.log(text)
  const localTime = new Date().toLocaleString()
  logText.value.push({
    text,
    timestamp: localTime.slice(11, localTime.length)
  })
  if (logContainer.value) {
    logContainer.value.scrollIntoView()
  }
}

setLogFunction(dLog)

onDeactivated(() => {
  document.body.classList.remove('qrscanner')
  stopScan()
})

// Scroll to bottom of logContainer after adding new log entry
watch(
  () => logText.value.length,
  () => {
    const lastChild = logContainer.value?.lastElementChild
    if (lastChild) {
      lastChild.scrollIntoView({ behavior: 'smooth' })
    }
  }
)

// Watch choir id input change and save to storage if changed
// TODO: This is only for testing and should be commented out / removed in final version
// since choir ids are assigned to clients via QR code and not by user
watch(
  () => choirId.value,
  async (value, oldValue) => {
    if (typeof value === 'number' && value !== oldValue) {
      await Preferences.set({
        key: 'choirId',
        value: String(value)
      })
    }
  }
)

// Enable/Disable KeepAwakt depending on registration status
watch(
  () => isRegistered.value,
  async (value) => {
    try {
      if (Capacitor.getPlatform() !== 'web') {
        if (value) {
          await KeepAwake.keepAwake()
          dLog('KeepAwake enabled.')
        } else {
          await KeepAwake.allowSleep()
          dLog('KeepAwake disabled.')
        }
      }
    } catch (error) {
      dLog((error as string).toString())
    }
  }
)

// watch(
//   () => isRegistered.value,
//   async (value) => {
//     if (value) {
//       playContinuousSound()
//     } else {
//       stopContinuousSound()
//     }
//   }
// )
</script>

<!-- <style scoped>
* {
  --background: #222;
  color: white;
}

#container {
  text-align: center;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

#container strong {
  font-size: 20px;
  line-height: 26px;
}

#container p {
  font-size: 16px;
  line-height: 22px;

  color: #8c8c8c;

  margin: 0;
}

#container a {
  text-decoration: none;
}

.btn__register {
  width: 160px;
  height: 160px;
  --border-radius: 100%;
  font-weight: bold;
  font-size: 1.2em;
  --background: #444;
}

.btn__register_active {
  --background: orange;
}

.btn__scan_barcode {
  width: 80px;
  height: 80px;
  --border-radius: 100%;
  font-weight: bold;
  --background: #444;
}

.logContainer {
  width: 100%;
  height: 20%;
  background-color: #444;
  position: absolute;
  bottom: 0;
  overflow: scroll;
}
</style> -->
