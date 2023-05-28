<script setup lang="ts">
import { getPerformanceWithTracks } from '@/services/api'
import type { SadissPerformance } from '@/types/types'
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import PlayerControls from '@/components/PlayerControls.vue'
import QrCodesModal from '@/components/QrCodesModal.vue'

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
  if (trackIndex) {
    selectedTrackIndex.value = trackIndex
  }
}

const qrCodesModal = ref<typeof QrCodesModal | null>()

onMounted(async () => {
  performance.value = await getPerformanceWithTracks(performanceId as string)
})
</script>
<template>
  <main class="flex h-screen flex-col justify-between">
    <div
      v-if="performance"
      class="flex flex-col">
      <div class="flex flex-col items-center">
        <h1 class="mb-2 text-3xl font-bold">{{ performance.name }}</h1>
        <p class="mb-4">Created by: {{ performance.username }}</p>
      </div>

      <div class="my-2 flex w-full flex-row-reverse">
        <button @click.stop="qrCodesModal?.openModal()">
          <font-awesome-icon
            icon="fa-qrcode"
            size="xl" />
        </button>
      </div>

      <div class="flex-1 space-y-2 overflow-y-scroll">
        <button
          v-for="(track, index) in performance.tracks"
          @click="selectTrack(index)"
          class="flex w-full border p-4"
          :class="{ 'bg-secondary': selectedTrack === track }">
          <p>{{ track.name }}</p>
        </button>
      </div>
    </div>

    <PlayerControls
      v-if="selectedTrack"
      :performance-id="(performanceId as string)"
      :selectedTrack="selectedTrack"
      :next-track="nextTrack"
      @nextTrackStarted="nextTrackStarted"
      @set-current-track="setCurrentTrack" />

    <QrCodesModal
      ref="qrCodesModal"
      v-if="performance"
      :performance-id="performance._id"
      :performance-name="performance.name" />
  </main>
</template>
