<script setup lang="ts">
import { getPerformanceWithTracks, startTrack, stopTrack } from '@/services/api'
import type { SadissPerformance } from '@/types/types'
import { onMounted, ref, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

// Get performance id from route
const route = useRoute()
const performanceId = route.params.id
const performance = ref<SadissPerformance>()

const handleStartTrack = async (trackId: string) => {
  await startTrack(trackId, performanceId as string, globalTime.value)
  playingTrackId.value = trackId
}

const handleStopTrack = async () => {
  await stopTrack(performanceId as string)
}

let motion: any
const globalTime = ref(-1)
const initializeMCorp = async () => {
  // @ts-ignore: Can't find name MCorp, which is added via <script> in index.html
  const mCorpApp = MCorp.app(import.meta.env.VITE_APP_MCORP_API_KEY, { anon: true })
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

const wsUrl = import.meta.env.VITE_APP_WS_URL
let attemptingToRegister = false
const isRegistered = ref(false)
const ws = ref<WebSocket>()

const playingTrackId = ref<string>('')
const playingTrackProgress = ref<number>(0)

const establishWebsocketConnection = async () => {
  if (attemptingToRegister || isRegistered.value) return
  attemptingToRegister = true
  ws.value = new WebSocket(wsUrl)

  ws.value.onopen = function () {
    isRegistered.value = true
    attemptingToRegister = false
    this.send(JSON.stringify({ message: 'isAdmin', performanceId }))
  }

  ws.value.onclose = () => {
    isRegistered.value = false
    attemptingToRegister = false
    // TODO: Handle lost connection. Does not mean that playback has stopped.
  }

  ws.value.onerror = (error) => {
    isRegistered.value = false
    attemptingToRegister = false
    console.error(JSON.stringify(error))
    // TODO: Handle error
  }

  ws.value.onmessage = (event) => {
    if (!event.data) {
      return
    }

    const data = JSON.parse(event.data)
    console.log('\nReceived message: ', data)

    if (data.start) {
      // TODO: Handle start
    }

    if (data.stop) {
      // TODO: Handle stop
      playingTrackId.value = ''
      playingTrackProgress.value = 0
      return
    }

    if (data.trackId) {
      playingTrackId.value = data.trackId
      playingTrackProgress.value = Math.floor((data.chunkIndex / data.totalChunks) * 100)
      console.log(playingTrackProgress.value)
    }
  }
}

onMounted(async () => {
  performance.value = await getPerformanceWithTracks(performanceId as string)
  initializeMCorp()
  establishWebsocketConnection()
})

onUnmounted(() => {
  ws.value?.close()
})
</script>
<template>
  <main>
    <div
      v-if="performance"
      class="flex flex-col items-center gap-1 px-2">
      <h1 class="my-2 text-3xl font-bold">{{ performance.name }}</h1>
      <p class="mb-4">Created by: {{ performance.username }}</p>
      <div
        v-for="track in performance.tracks"
        class="relative flex w-full justify-between border p-4">
        <!-- Track progress bar -->
        <div
          v-if="track._id === playingTrackId"
          class="absolute bottom-0 left-0 h-[25%] bg-secondary bg-opacity-50"
          :style="{ width: playingTrackProgress + '%' }" />
        <p>{{ track.name }}</p>
        <button
          v-if="track._id !== playingTrackId"
          @click.stop="handleStartTrack(track._id)">
          <font-awesome-icon
            icon="fa-play"
            size="lg" />
        </button>
        <button
          v-else
          @click.stop="handleStopTrack">
          <font-awesome-icon
            icon="fa-pause"
            size="lg" />
        </button>
      </div>
    </div>
  </main>
</template>
