<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { Track } from '@/types/types'
import { loadTrackForPlayback, startTrack, stopTrack } from '@/services/api'

const props = defineProps<{
  performanceId: string
  selectedTrack: Track
  nextTrack?: Track
  trackLoaded: boolean
}>()

const emit = defineEmits<{
  (e: 'nextTrackStarted'): void
  (e: 'setCurrentTrack', trackId: string): void
}>()

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

const playingTrackId = ref<string>('')

const handleStartTrack = async (trackId: string) => {
  await startTrack(trackId, props.performanceId, globalTime.value, shouldLoop.value)
  playingTrackId.value = trackId
}

const handleStopTrack = async () => {
  const res = await stopTrack(props.performanceId)
  if (res) {
    shouldGoToNextTrack.value = false
    playingTrackId.value = ''
  }
}

const shouldLoop = ref(false)
const toggleLoop = () => {
  if (playingTrackId.value) {
    alert('Cannot toggle loop while track is playing')
    return
  }
  shouldLoop.value = !shouldLoop.value
}

const shouldGoToNextTrack = ref(false)
const toggleShouldGoToNextTrack = () => {
  shouldGoToNextTrack.value = !shouldGoToNextTrack.value
}

const wsUrl = import.meta.env.VITE_APP_WS_URL
let attemptingToRegister = false
const isRegistered = ref(false)
const ws = ref<WebSocket>()

const progress = ref<number>(0)
const currentChunkIndex = ref<number>(0)
const totalChunks = ref<number>(0)

const establishWebsocketConnection = async () => {
  if (attemptingToRegister || isRegistered.value) return
  attemptingToRegister = true
  ws.value = new WebSocket(wsUrl)

  ws.value.onopen = function () {
    isRegistered.value = true
    attemptingToRegister = false
    this.send(JSON.stringify({ message: 'isAdmin', performanceId: props.performanceId }))
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

  ws.value.onmessage = async (event) => {
    if (!event.data) {
      return
    }

    const data = JSON.parse(event.data)

    if (data.start) {
      // Nothing to do at start.
    }

    if (data.stop) {
      if (shouldGoToNextTrack.value && props.nextTrack) {
        const trackLoadedSuccessfully = await loadTrackForPlayback(props.nextTrack._id, props.performanceId)
        if (!trackLoadedSuccessfully) {
          alert('Failed to load next track. Stopping.')
          playingTrackId.value = ''
          return
        }
        handleStartTrack(props.nextTrack._id)
        emit('nextTrackStarted')
      } else {
        playingTrackId.value = ''
      }
      progress.value = 0
      currentChunkIndex.value = 0
      totalChunks.value = 0
      return
    }

    if (data.trackId) {
      playingTrackId.value = data.trackId
      progress.value = Math.floor((data.chunkIndex / data.totalChunks) * 100)
      currentChunkIndex.value = data.chunkIndex
      totalChunks.value = data.totalChunks
      shouldLoop.value = data.loop

      if (playingTrackId.value !== props.selectedTrack._id) {
        emit('setCurrentTrack', playingTrackId.value)
      }
    }
  }
}

onMounted(async () => {
  initializeMCorp()
  establishWebsocketConnection()
})

onUnmounted(() => {
  ws.value?.close()
})
</script>

<template>
  <div class="flex h-[100px] flex-col items-center justify-between">
    <div>
      <p>{{ selectedTrack.name }}</p>
    </div>
    <div class="flex gap-4">
      <button
        @click="toggleLoop"
        :class="{ 'text-highlight': shouldLoop }"
        title="Toggle loop">
        <font-awesome-icon
          icon="fa-repeat"
          size="lg" />
      </button>
      <div
        v-if="!trackLoaded"
        title="Wait for track load">
        <font-awesome-icon
          icon="fa-clock"
          size="2x" />
      </div>
      <button
        v-else-if="!playingTrackId"
        @click="handleStartTrack(selectedTrack._id)"
        title="Start track">
        <font-awesome-icon
          icon="fa-play-circle"
          size="2x" />
      </button>
      <button
        v-else
        @click="handleStopTrack"
        title="Stop track">
        <font-awesome-icon
          icon="fa-stop-circle"
          size="2x" />
      </button>
      <button
        @click="toggleShouldGoToNextTrack"
        :class="{ 'text-highlight': shouldGoToNextTrack }"
        title="Toogle auto-play">
        <font-awesome-icon
          icon="fa-forward-fast"
          size="lg" />
      </button>
    </div>
    <!-- Track progress bar -->
    <div class="relative h-[25%] w-full">
      <div
        class="absolute h-full bg-secondary"
        :style="{ width: progress + '%' }" />
      <p
        v-if="totalChunks"
        class="relative h-full text-center text-sm">
        {{ currentChunkIndex }} / {{ totalChunks }}
      </p>
    </div>
  </div>
</template>
