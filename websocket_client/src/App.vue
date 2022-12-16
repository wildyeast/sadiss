<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { usePlayer } from './composables/usePlayer';
import { generateMockPartialData, generateBeep, generateSplitPartial } from './helpers/generateMockData';
import { PartialChunk } from './types/types';

const isRegistered = ref(false)
const ws = ref<WebSocket>()

const clientId = ref(1)

const motion = ref()
const globalTime = ref(0)

// const mode = ref('nonChoir')
const mode = ref('choir')

let trackRunning = false

const { initialSetup, handleChunkData, shouldRequestChunks, chunksRequested, startAudioCtx } = usePlayer()

let mockData: PartialChunk[][] = []
// for (let i = 0; i < 10; i++) {
//   mockData.push(generateMockPartialData(i, 10))
// }
// mockData = generateBeep()
mockData = generateBeep(true)
// mockData = generateSplitPartial()

const establishWebsocketConnection = () => {
  startAudioCtx()

  ws.value = new WebSocket('ws://localhost:443/')
  ws.value.onopen = (event) => {
    console.log('Connection is open')
    ws.value!.send(JSON.stringify({ message: 'clientId', clientId: clientId.value }))
  }
  ws.value.onerror = error => console.error(error)

  // ws.value.send(JSON.stringify({ message: 'test', clientId: clientId.value }))

  ws.value.onmessage = (event) => {
    const data = JSON.parse(event.data)

    // Stop track if no more chunks
    if (!Object.keys(data.partialData).length) {
      console.log('Received partialData is empty!')
      trackRunning = false
      window.clearInterval(requestChunkIntervalId)
      return
    }

    if (!trackRunning) {
      initialSetup(data.partialData)
      startRequestChunkInterval()
      trackRunning = true
    } else {
      handleChunkData(data.partialData)
    }
  }
}

let requestChunkIntervalId: number
const startRequestChunkInterval = () => {
  requestChunkIntervalId = window.setInterval(() => {
    if (shouldRequestChunks()) {
      ws.value?.send(JSON.stringify({ message: 'chunkRequest' }))
      chunksRequested()
    }
  }, 100)
}

const sendPartialChunksToServer = () => {
  const clientData = { partialChunks: mockData }
  ws.value?.send(JSON.stringify(clientData))
}

const startTrack = () => {
  ws.value?.send(JSON.stringify({ message: 'start', mode: mode.value }))
}

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
  // await initializeMCorp()
  // startClock()
})


</script>

<template>
  <input v-model="clientId"
         placeholder="clientId" />
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
