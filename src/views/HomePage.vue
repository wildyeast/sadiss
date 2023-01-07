<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Blank</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Blank</ion-title>
        </ion-toolbar>
      </ion-header>

      <div id="container">
        <ion-button @click="register">Test</ion-button>
        <ion-button @click="dLog('User interaction')">User interaction</ion-button>
        <p v-if="isRegistered">Registered</p>
        <p v-else>Not registered.</p>
        <p v-for="text, idx of logText"
           :key="idx">{{ text }}</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton } from '@ionic/vue';
import { ref, onMounted } from 'vue';
// import { TextToSpeech } from '@capacitor-community/text-to-speech'
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
      handleChunkData(data.chunk)
    }
  }
}

let motion: any
const initializeMCorp = async () => {
  // @ts-expect-error: Can't find name MCorp, which is added via <script> in index.html
  // eslint-disable-next-line
  const mCorpApp = MCorp.app(VUE_APP_MCORP_API_KEY, { anon: true })
  mCorpApp.run = () => {
    motion = mCorpApp.motions['shared']
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

const logText = ref<string[]>([])
/** 
* Prints the given string to the on-screen log.
* @param string text - String to print to log.
*/
const dLog = (text: string) => {
  logText.value?.push(text)
}
setLogFunction(dLog)


</script>

<style scoped>
#container {
  text-align: center;

  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
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
</style>
