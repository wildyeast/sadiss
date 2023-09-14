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
}

const trackLoaded = ref<boolean>(false)
const selectTrack = async (trackIndex: number) => {
  trackLoaded.value = false
  selectedTrackIndex.value = trackIndex
  const res = await loadTrackForPlayback(selectedTrack.value?._id as string, performanceId as string)
  if (res) {
    trackLoaded.value = true
  }
}

const nextTrackStarted = () => selectedTrackIndex.value++

const setCurrentTrack = (trackId: string) => {
  const trackIndex = performance.value?.tracks.findIndex((track) => track._id === trackId)
  if (trackIndex) {
    selectedTrackIndex.value = trackIndex
  }
}

const qrCodesModal = ref<typeof QrCodesModal | null>()

const connectedClients = ref<{ [choirId: string]: number }>({})

let getClientsInterval: any // any because of currently unresolved type-checking error during build step
onMounted(async () => {
  performance.value = await getPerformanceWithTracks(performanceId as string)
  if (performance.value) {
    tracks.value = performance.value.tracks
  }

  // Periodically update connected clients
  getClientsInterval = setInterval(async () => {
    connectedClients.value = await getClientCountPerChoirId(performanceId as string)
  }, 1000)
})

onUnmounted(() => {
  clearInterval(getClientsInterval)
})

//https://github.com/Alfred-Skyblue/vue-draggable-plus
</script>
<template>
  <main class="h-full">
    <div
      v-if="performance"
      class="flex h-full flex-col">
      <!-- Page Header -->
      <div class="sticky top-0 flex flex-col items-center justify-between border-b bg-primary px-2 pb-4 lg:px-10">
        <h1 class="pb-4 text-center font-bold">{{ performance.name }}</h1>
        <div class="flex w-full justify-between">
          <p>Created by: {{ performance.creator.username }}</p>
          <button
            @click.stop="qrCodesModal?.openModal()"
            title="Generate QR codes">
            <font-awesome-icon
              icon="fa-qrcode"
              size="xl" />
          </button>
        </div>
        <!-- List of connected clients -->
        <div
          v-if="Object.keys(connectedClients).length"
          class="flex gap-4">
          <span v-for="choirId of Object.keys(connectedClients)">
            <font-awesome-icon
              icon="fa-qrcode"
              class="mr-1" />
            {{ choirId }}: {{ connectedClients[choirId] }}
          </span>
        </div>
      </div>

      <!-- Track list -->
      <div
        v-if="tracks.length"
        class="space-y-2 overflow-y-scroll px-2 lg:px-10">
        <VueDraggable
          v-model="tracks"
          class="space-y-2 py-4"
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
      </div>
      <div
        v-else-if="store.userName === performance.creator.username"
        class="mt-4 flex h-full flex-col items-center">
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
      <PlayerControls
        v-if="selectedTrack"
        :performance-id="(performanceId as string)"
        :selectedTrack="selectedTrack"
        :next-track="nextTrack"
        :track-loaded="trackLoaded"
        @nextTrackStarted="nextTrackStarted"
        @set-current-track="setCurrentTrack"
        class="sticky bottom-0 bg-primary py-2" />
    </div>

    <QrCodesModal
      ref="qrCodesModal"
      v-if="performance"
      :performance-id="performance._id"
      :performance-name="performance.name" />
  </main>
</template>
