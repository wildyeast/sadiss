<script setup lang="ts">
import { getPerformanceWithTracks, startTrack } from '@/services/api'
import type { SadissPerformance } from '@/types/types'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

// Get performance id from route
const route = useRoute()
const performanceId = route.params.id
const performance = ref<SadissPerformance>()

const handleStartTrack = async (trackId: string) => {
  await startTrack(trackId, performanceId as string, globalTime.value)
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

onMounted(async () => {
  performance.value = await getPerformanceWithTracks(performanceId as string)
  initializeMCorp()
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
        class="flex w-full justify-between border p-4">
        <p>{{ track.name }}</p>
        <button @click.stop="handleStartTrack(track._id)">
          <font-awesome-icon
            icon="fa-play"
            size="lg" />
        </button>
      </div>
    </div>
  </main>
</template>
