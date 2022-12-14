<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { usePlayer } from './composables/usePlayer';
import { generateMockPartialData } from './helpers/generateMockData';
import { PartialChunk } from './types/types';

const isRegistered = ref(false)
const ws = ref<WebSocket>()

const clientId = ref(1)

const motion = ref()
const globalTime = ref(0)

const { initialSetup, handleChunkData, startRequestChunksInterval } = usePlayer()

const mockData: PartialChunk[][] = []
for (let i = 0; i < 3; i++) {
  mockData.push(generateMockPartialData(i, 10))
}

const register = () => {
  ws.value = new WebSocket('ws://localhost:443/');

  ws.value.onmessage = (event) => {
    const data = JSON.parse(event.data)
    if (data.message === 'start') {
      initialSetup(data.chunks)
      startRequestChunksInterval(ws)
    } else if (data.message === 'chunkRequest') {
      handleChunkData(data.chunks)
    }
  }
}

const sendPartialChunksToServer = () => {
  const clientData = { clientId: clientId.value, partialChunks: mockData }
  ws.value?.send(JSON.stringify(clientData))
}

const startTrack = () => ws.value?.send(JSON.stringify('start'))

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
  <button @click="register"
          :disabled="isRegistered">Register</button>
  <button class="btn"
          @click="sendPartialChunksToServer">Send Chunks To Server</button>
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
