<script setup lang="ts">
import { getPerformanceWithTracks } from '@/services/api'
import type { SadissPerformance } from '@/types/types'
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import PlayerControls from '@/components/PlayerControls.vue'
import QrCodesModal from '@/components/QrCodesModal.vue'
import FixedViewHeader from '@/components/FixedViewHeader.vue'

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
      <FixedViewHeader :title="performance.name">
        <div class="flex justify-between">
          <p class="mb-4">Created by: {{ performance.creator.username }}</p>
          <button @click.stop="qrCodesModal?.openModal()">
            <font-awesome-icon
              icon="fa-qrcode"
              size="xl" />
          </button>
        </div>
      </FixedViewHeader>

      <div
        v-if="performance.tracks.length"
        class="mt-12 flex-1 space-y-2 overflow-y-scroll pt-16">
        <button
          v-for="(track, index) in performance.tracks"
          @click="selectTrack(index)"
          class="flex w-full border p-4"
          :class="{ 'bg-secondary': selectedTrack === track }">
          <p>{{ track.name }}</p>
        </button>
      </div>
      <div
        v-else
        class="bg-red mt-12 flex h-full flex-col items-center justify-center pt-16">
        <p>No tracks yet.</p>
        <router-link
          to="/tracks"
          class="mt-4 rounded-md bg-light p-4 text-primary"
          >Go to tracks and add some
        </router-link>
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
