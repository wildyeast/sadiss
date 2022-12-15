<script setup lang="ts">
import { monitorEventLoopDelay } from 'perf_hooks';
import { onMounted, ref } from 'vue'
import { usePlayer } from './composables/usePlayer';
import { generateMockPartialData } from './helpers/generateMockData';
import { PartialChunk } from './types/types';

const isRegistered = ref(false)
const ws = ref<WebSocket>()

const clientId = ref(1)

const motion = ref()
const globalTime = ref(0)

const mode = ref('nonChoir')

let trackRunning = false

const { initialSetup, handleChunkData, startRequestChunksInterval } = usePlayer()

const mockData: PartialChunk[][] = []
for (let i = 0; i < 10; i++) {
  mockData.push(generateMockPartialData(i, 10))
}

const establishWebsocketConnection = () => {
  ws.value = new WebSocket('ws://localhost:443/')
  ws.value.onerror = error => console.error(error)

  // ws.value.send(JSON.stringify({ message: 'test', clientId: clientId.value }))

  ws.value.onmessage = (event) => {
    const data = JSON.parse(event.data)

    console.log('Data received: ', data)

    // Stop track if no more chunks
    // TODO: Also stop requestChunkInterval
    if (!data.partialData) {
      console.log('Received partialData is empty!')
      trackRunning = false
      return
    }

    if (!trackRunning) {
      initialSetup(data.partialData)
      startRequestChunksInterval(ws)
      trackRunning = true
    } else {
      handleChunkData(data.partialData)
    }
  }
}

const sendPartialChunksToServer = () => {
  const clientData = { partialChunks: mockData }
  ws.value?.send(JSON.stringify(clientData))
}

const startTrack = () => ws.value?.send(JSON.stringify({ message: 'start', mode: mode.value }))

const sentPartialDataToServerViaHttp = async () => {
  const res = await fetch('http://localhost:3000/partialData', {
    method: 'POST',
    // mode: 'cors',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ data: mockData })
  })
}

const initializeMCorp = async () => {
  // @ts-ignore: Can't find name MCorp, which is added via <script> in index.html
  const mCorpApp = MCorp.app(import.meta.env.VITE_MCORP_API_KEY, { anon: true })
  mCorpApp.run = () => motion.value = mCorpApp.motions['shared']
  mCorpApp.init()
}

const startClock = () => {
  setInterval(() => {
    globalTime.value = motion.value?.pos
  }, 10)
}

onMounted(async () => {
  await initializeMCorp()
  startClock()
})


</script>

<template>
  <p class="timeDisplay">Current time: {{ globalTime?.toFixed(2) }}</p>
  <p v-if="isRegistered">Currently registered</p>
  <p v-else>Not registered</p>
  <button @click="establishWebsocketConnection"
          :disabled="isRegistered">Register</button>
  <button class="btn"
          @click="sendPartialChunksToServer">Send Chunks To Server</button>
  <select v-model="mode">
    <option value="nonChoir">Non-Choir</option>
    <option value="choir">Choir</option>
  </select>
  <button class="btn"
          @click="startTrack">Start</button>
  <button class="btn"
          @click="sentPartialDataToServerViaHttp">Send data per http</button>

</template>

<style scoped>
.timeDisplay {
  width: 100%;
}

.btn {
  display: block;
  margin-top: 5px;
}
</style>
