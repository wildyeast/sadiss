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
        <ion-button @click="register"
                    :disabled="!mcorpConnected"
                    class="btn__register"
                    :class="{ btn__register_active: isRegistered }">
          {{ isRegistered ? 'Registered' : 'Register' }}
        </ion-button>
        <div class="logContainer">
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
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton } from '@ionic/vue';
import { ref, onMounted, computed } from 'vue';
import { TextToSpeech } from '@capacitor-community/text-to-speech'
import { usePlayer } from '../composables/usePlayer';


// 'env'
const VUE_APP_MCORP_API_KEY = '8844095860530063641'

const VUE_APP_WS_SERVER_URL = '192.168.0.87'
const VUE_APP_WS_SERVER_PORT = '443'


const isRegistered = ref(false)
const ws = ref<WebSocket>()

const clientId = ref(1)

const globalTime = ref(0)

let trackRunning = false

const { handleChunkData, startAudioCtx, setStartTime, setLogFunction } = usePlayer()

const register = () => {
  if (isRegistered.value) return
  establishWebsocketConnection()
  // initializeTtsPlayer(globalTime)
}

const establishWebsocketConnection = () => {
  startAudioCtx(globalTime.value)

  ws.value = new WebSocket(`ws://${VUE_APP_WS_SERVER_URL}:${VUE_APP_WS_SERVER_PORT}`)

  ws.value.onopen = function () {
    console.log('Connection is open')
    isRegistered.value = true
    this.send(JSON.stringify({ message: 'clientId', clientId: clientId.value }))
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
      dLog('Partials: ' + Object.keys(data.chunk.partials).join())
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

onMounted(async () => {
  await initializeMCorp()
  // register()
})

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
}
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
}

#container {
  text-align: center;
  height: 100%;

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

.logContainer {
  width: 100%;
  height: 33%;
  background-color: #444;
  position: absolute;
  bottom: 0;
  overflow: scroll;
}
</style>
