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

const selectedTrack = ref<Track>()
const playingTrackId = ref<string>('')

onMounted(async () => {
  performance.value = await getPerformanceWithTracks(performanceId as string)
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
      </button>
    </div>
    <PlayerControls
      v-if="selectedTrack"
      :selectedTrack="selectedTrack"
      :performance-id="(performanceId as string)" />
  </main>
</template>
