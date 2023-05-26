<script setup lang="ts">
import { getPerformanceWithTracks } from '@/services/api'
import type { SadissPerformance, Track } from '@/types/types'
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import PlayerControls from '@/components/PlayerControls.vue'

// Get performance id from route
const route = useRoute()
const performanceId = route.params.id
const performance = ref<SadissPerformance>()

const selectedTrackIndex = ref<number>(-1)

const selectedTrack = computed(() => {
  if (selectedTrackIndex.value === -1) return undefined
  return performance.value?.tracks[selectedTrackIndex.value]
})

const nextTrack = computed(() => {
  if (selectedTrackIndex.value === -1) return undefined
  return performance.value?.tracks[selectedTrackIndex.value + 1]
})

const selectTrack = (trackIndex: number) => (selectedTrackIndex.value = trackIndex)

const nextTrackStarted = () => selectedTrackIndex.value++

const setCurrentTrack = (trackId: string) => {
  const trackIndex = performance.value?.tracks.findIndex((track) => track._id === trackId)
  if (trackIndex === undefined) return
  selectedTrackIndex.value = trackIndex
}

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
        v-for="(track, index) in performance.tracks"
        @click="selectTrack(index)"
        class="relative flex w-full justify-between border p-4"
        :class="{ 'bg-secondary': selectedTrack === track }">
        <p>{{ track.name }}</p>
      </button>
    </div>
    <PlayerControls
      v-if="selectedTrack"
      :performance-id="(performanceId as string)"
      :selectedTrack="selectedTrack"
      :next-track="nextTrack"
      @nextTrackStarted="nextTrackStarted"
      @set-current-track="setCurrentTrack" />
  </main>
</template>
