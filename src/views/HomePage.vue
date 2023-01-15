<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>SADISS</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">SADISS</ion-title>
        </ion-toolbar>
      </ion-header>

      <div id="container">
        <ion-item>
          <ion-label>Choir ID:</ion-label>
          <ion-input type="number"
                     v-model.number="choirId" />
        </ion-item>
        <ion-button @click="register"
                    :disabled="!mcorpConnected"
                    class="btn__register"
                    :class="{ btn__register_active: isRegistered }">
          {{ isRegistered? 'Registered': 'Register' }}
        </ion-button>
        <ion-button @click="scanCode"
                    class="btn__scan_barcode"
                    :class="{ btn__register_active: isRegistered }">
          QR
        </ion-button>
        <div class="logContainer"
             ref="logContainer">
          <div v-for="log, idx of logText"
               :key="idx"
               style="width: 100%; display: flex; color: white;">
            <span style="min-width: 20%;">{{ log.timestamp }}</span>
            <span style="text-align: left">{{ log.text }}</span>
          </div>
        </div>
        <!-- <ion-button @click="speak('This is a test.')">Speak</ion-button> -->
        <!-- <p v-if="isRegistered">Registered</p> -->
        <!-- <p v-else>Not registered.</p> -->
        <!-- <p v-for="text, idx of logText"
           :key="idx">{{ text }}</p> -->
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, IonInput, IonLabel, IonItem } from '@ionic/vue';
import { ref, onMounted, watch } from 'vue';
import { TextToSpeech } from '@capacitor-community/text-to-speech'
import { usePlayer } from '../composables/usePlayer';
import { useBarcodeScanner } from '@/composables/useBarcodeScanner';
import { Storage } from '@ionic/storage';

// Init storage
const store = new Storage()

// 'env'
const VUE_APP_MCORP_API_KEY = '8844095860530063641'

const VUE_APP_WS_SERVER_URL = '192.168.0.87'
const VUE_APP_WS_SERVER_PORT = '443'


const isRegistered = ref(false)
const ws = ref<WebSocket>()

const choirId = ref(1)

const globalTime = ref(0)

let trackRunning = false

const { handleChunkData, startAudioCtx, setStartTime, setLogFunction } = usePlayer()

const { startScan } = useBarcodeScanner()

const register = () => {
  if (isRegistered.value) return
  establishWebsocketConnection()
}

const establishWebsocketConnection = () => {
  startAudioCtx(globalTime.value)

  ws.value = new WebSocket(`ws://${VUE_APP_WS_SERVER_URL}:${VUE_APP_WS_SERVER_PORT}`)

  ws.value.onopen = function () {
    console.log('Connection is open')
    isRegistered.value = true
    this.send(JSON.stringify({ message: 'clientId', clientId: choirId.value }))
  }

  ws.value.onclose = () => {
    dLog('Websocket connection closed.')
    isRegistered.value = false
    // Trying to reconnect here while App is in background does not work.
  }

  ws.value.onerror = error => {
    isRegistered.value = false
    console.error(error)
  }

  ws.value.onmessage = (event) => {
    const data = JSON.parse(event.data)
    console.log('\nReceived message: ', data)


    if (!trackRunning) {
      trackRunning = true
    }

    // TODO: This is not ideal, we shouldn't set globalStartTime every time we receive data
    setStartTime(data.startTime)
    if (Object.keys(data.chunk)) {
      dLog('Partials: ' + data.chunk.partials.map((el: any) => el.index).join())
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
    motion = mCorpApp.motions['shared']
    mcorpConnected.value = true
    startClock()
  }
  mCorpApp.init()
}

const startClock = () => {
  setInterval(() => {
    globalTime.value = motion.pos
  }, 10)
}

const scanCode = async () => {
  // Make camera visible and everything else invisible in app viewport, classes defined in App.vue
  document.body.classList.add("qrscanner");
  await startScan()
  // Make camera invisible, and everything else visible
  document.body.classList.remove("qrscanner");
}

onMounted(async () => {
  await store.create()
  choirId.value = await store.get('choirId')
  await initializeMCorp()
  // register()
})

const logContainer = ref<HTMLDivElement | null>(null)
const logText = ref<{ text: string, timestamp: string }[]>([])
/** 
* Prints the given string to the on-screen log.
* @param string text - String to print to log. 
*/
const dLog = (text: string) => {
  const localTime = new Date().toLocaleString()
  logText.value.push({
    text,
    timestamp: localTime.slice(11, localTime.length)
  })
  if (logContainer.value) {
    logContainer.value.scrollIntoView()
  }
}

// Scroll to bottom of logContainer after adding new log entry
watch(() => logText.value.length, () => {
  const lastChild = logContainer.value?.lastElementChild
  if (lastChild) {
    lastChild.scrollIntoView({ behavior: 'smooth' })
  }
})

// Watch choir id input change and save to storage if changed
// TODO: This is only for testing and should be commented out / removed in final version
// since choir ids are assigned to clients via QR code and not by user
watch(() => choirId.value, async (value, oldValue) => {
  if (typeof value === 'number' && value !== oldValue) {
    await store.set('choirId', value)
  }
})

setLogFunction(dLog)

const speak = async (text: string) => {
  await TextToSpeech.speak({
    text: text,
    lang: 'en-US',
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    category: 'playback',
  })
}


</script>

<style scoped>
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
  font-size: 1.2em;
  --background: #444;
}

.logContainer {
  width: 100%;
  height: 33%;
  background-color: #444;
  position: absolute;
  bottom: 0;
  overflow: scroll;
}
</style>
