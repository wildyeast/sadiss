<script setup lang="ts">
import {
  getPerformanceWithTracks,
  getClientCountPerChoirId,
  loadTrackForPlayback,
  updateTrackPerformanceOrder,
  removeTrackFromPerformance
} from '@/services/api'
import type { SadissPerformance, Track, TrackPerformanceIdAndSortOrder } from '@/types/types'
import { onMounted, ref, computed, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import PlayerControls from '@/components/PlayerControls.vue'
import QrCodesModal from '@/components/QrCodesModal.vue'
import FixedViewHeader from '@/components/FixedViewHeader.vue'
import { useStore } from '@/stores/store'
import { VueDraggable } from 'vue-draggable-plus'

const store = useStore()

// Get performance id from route
const route = useRoute()
const performanceId = route.params.id
const performance = ref<SadissPerformance>()
const tracks = ref<Track[]>([])

const selectedTrackIndex = ref<number>(-1)

// TODO: Are the checks for -1 necessary?
const selectedTrack = computed(() => {
  if (selectedTrackIndex.value === -1) return undefined
  return performance.value?.tracks[selectedTrackIndex.value]
})

const nextTrack = computed(() => {
  if (selectedTrackIndex.value === -1) return undefined
  return performance.value?.tracks[selectedTrackIndex.value + 1]
})

const onSortOrderUpdate = async () => {
  const trackPerformanceIdsAndSortOrders: TrackPerformanceIdAndSortOrder[] = []
  tracks.value.forEach((track, index) => {
    trackPerformanceIdsAndSortOrders.push({
      trackPerformanceId: track.trackPerformanceId as string,
      sortOrder: index + 1
    })
  })

  // Make no track selected to prevent a visual issue where the selected track
  // changes to the one taking its place after it was dragged.
  selectedTrackIndex.value = -1

  await updateTrackPerformanceOrder(trackPerformanceIdsAndSortOrders)
}

const handleRemoveTrackFromPerformance = async (trackPerformanceId: string) => {
  await removeTrackFromPerformance(trackPerformanceId)
  tracks.value = tracks.value.filter((track) => track.trackPerformanceId !== trackPerformanceId)
  selectedTrackIndex.value = -1
  loadPerformanceAndTracks()
}

const trackLoaded = ref(false)
const selectedTrackLengthInChunks = ref(0)
const selectTrack = async (trackIndex: number) => {
  trackLoaded.value = false
  selectedTrackIndex.value = trackIndex
  const res = await loadTrackForPlayback(selectedTrack.value?._id as string, performanceId as string)
  if (res) {
    trackLoaded.value = true
    selectedTrackLengthInChunks.value = res
  }
}

const nextTrackStarted = () => selectedTrackIndex.value++

const setCurrentTrack = (trackId: string) => {
  const trackIndex = performance.value?.tracks.findIndex((track) => track._id === trackId)
  if (trackIndex) {
    selectedTrackIndex.value = trackIndex
  }
}

const loadPerformanceAndTracks = async () => {
  performance.value = await getPerformanceWithTracks(performanceId as string)
  if (performance.value) {
    tracks.value = performance.value.tracks
  }
}

const qrCodesModal = ref<typeof QrCodesModal | null>()

const connectedClients = ref<{ [choirId: string]: number }>({})

let getClientsInterval: any // any because of currently unresolved type-checking error during build step
onMounted(() => {
  loadPerformanceAndTracks()

  // Periodically update connected clients
  getClientsInterval = setInterval(async () => {
    connectedClients.value = await getClientCountPerChoirId(performanceId as string)
  }, 1000)
})

onUnmounted(() => {
  clearInterval(getClientsInterval)
})
</script>
<template>
  <main class="flex h-screen flex-col justify-between">
    <div
      v-if="performance"
      class="flex flex-col">
      <FixedViewHeader :title="performance.name">
        <div class="flex items-center justify-between">
          <p>Created by: {{ performance.creator.username }}</p>
          <button
            @click.stop="qrCodesModal?.openModal()"
            title="Generate QR codes">
            <font-awesome-icon
              icon="fa-qrcode"
              size="xl" />
          </button>
        </div>
      </FixedViewHeader>

      <!-- Spacer for pushing content below down so it is visible below the fixed header
        TODO: Maybe do away with the fixed header or think of a less annoying way of doing this. -->
      <div class="mt-12 pt-16"></div>

      <div
        v-if="Object.keys(connectedClients).length"
        class="flex gap-4">
        <span v-for="choirId of Object.keys(connectedClients)">
          <font-awesome-icon
            icon="fa-qrcode"
            class="mr-1" />{{ choirId }}: {{ connectedClients[choirId] }}</span
        >
      </div>

      <VueDraggable
        v-if="tracks.length"
        v-model="tracks"
        class="mt-4 flex-1 space-y-2 overflow-y-scroll"
        handle=".drag-handle"
        animation="100"
        @update="onSortOrderUpdate">
        <button
          v-for="(track, index) in tracks"
          @click="selectTrack(index)"
          class="flex w-full items-center justify-between border p-4"
          :class="{ 'bg-secondary': selectedTrack === track }">
          <p>{{ track.name }}</p>
          <div class="flex gap-4">
            <font-awesome-icon
              @click.stop="handleRemoveTrackFromPerformance(track.trackPerformanceId as string)"
              icon="fa-trash"
              size="lg"
              class="mr-2"
              title="Remove track from performance" />

            <font-awesome-icon
              icon="fa-bars"
              size="lg"
              class="drag-handle"
              @click.stop
              title="Click and drag to change order" />
          </div>
        </button>
      </VueDraggable>
      <div
        v-else-if="store.userName === performance.creator.username"
        class="bg-red flex h-full flex-col items-center">
        <p>No tracks yet.</p>
        <router-link
          to="/tracks"
          class="font-bold underline"
          >Go to tracks and add some
        </router-link>
      </div>
      <div
        v-else
        class="bg-red flex h-full flex-col items-center">
        <p>No tracks yet.</p>
        <p>
          Ask <span class="font-bold">{{ performance.creator.username }}</span> to add some.
        </p>
      </div>
    </div>

    <PlayerControls
      v-if="selectedTrack"
      :performance-id="(performanceId as string)"
      :selectedTrack="selectedTrack"
      :next-track="nextTrack"
      :track-loaded="trackLoaded"
      :selected-track-length-in-chunks="selectedTrackLengthInChunks"
      @nextTrackStarted="nextTrackStarted"
      @set-current-track="setCurrentTrack" />

    <QrCodesModal
      ref="qrCodesModal"
      v-if="performance"
      :performance-id="performance._id"
      :performance-name="performance.name" />
  </main>
</template>
