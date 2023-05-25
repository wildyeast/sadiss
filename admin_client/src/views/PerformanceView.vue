<script setup lang="ts">
import { getPerformanceWithTracks, startTrack, stopTrack } from '@/services/api'
import type { SadissPerformance, Track } from '@/types/types'
import { onMounted, ref, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import PlayerControls from '@/components/PlayerControls.vue'

// Get performance id from route
const route = useRoute()
const performanceId = route.params.id
const performance = ref<SadissPerformance>()

const handleStartTrack = async () => {
  if (!selectedTrack.value?._id) {
    alert('No track selected')
    return
  }
  await startTrack(selectedTrack.value?._id, performanceId as string, globalTime.value)
  playingTrackId.value = selectedTrack.value?._id
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

const selectedTrack = ref<Track>()
const playingTrackId = ref<string>('')
const playingTrackProgress = ref<number>(0)
const playingTrackCurrentChunkIndex = ref<number>(0)
const playingTrackTotalChunks = ref<number>(0)

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

    if (data.start) {
      // TODO: Handle start
    }

    if (data.stop) {
      // TODO: Handle stop
      playingTrackId.value = ''
      playingTrackProgress.value = 0
      playingTrackCurrentChunkIndex.value = 0
      playingTrackTotalChunks.value = 0
      return
    }

    if (data.trackId) {
      playingTrackId.value = data.trackId
      playingTrackProgress.value = Math.floor((data.chunkIndex / data.totalChunks) * 100)
      playingTrackCurrentChunkIndex.value = data.chunkIndex
      playingTrackTotalChunks.value = data.totalChunks
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
  <main class="flex flex-col justify-between">
    <div
      v-if="performance"
      class="flex flex-col items-center gap-1 px-2">
      <h1 class="my-2 text-3xl font-bold">{{ performance.name }}</h1>
      <p class="mb-4">Created by: {{ performance.username }}</p>
      <button
        v-for="track in performance.tracks"
        @click="selectedTrack = track"
        class="relative flex w-full justify-between border p-4"
        :class="{ 'bg-secondary': selectedTrack === track }">
        <p>{{ track.name }}</p>
        <button
          v-if="track._id !== playingTrackId"
          @click.stop="">
          <font-awesome-icon
            icon="fa-trash"
            size="lg" />
        </button>
        <button
          v-else
          @click.stop="handleStopTrack">
          <font-awesome-icon
            icon="fa-pause"
            size="lg" />
        </button>
      </button>
    </div>
    <PlayerControls
      :isPlaying="playingTrackId !== ''"
      :progress="playingTrackProgress"
      :currentChunkIndex="playingTrackCurrentChunkIndex"
      :totalChunks="playingTrackTotalChunks"
      :selectedTrack="selectedTrack"
      @start-track="handleStartTrack"
      @stop-track="handleStopTrack" />
  </main>
</template>
