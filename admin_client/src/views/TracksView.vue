<script setup lang="ts">
import router from '@/router'
import { getTracks, deleteTrack, addTrackToPerformance } from '@/services/api'
import type { Track } from '@/types/types'
import { onMounted, ref } from 'vue'
import AddTrackModal from '@/components/AddTrackModal.vue'
import AddTrackToPerformanceModal from '@/components/AddTrackToPerformanceModal.vue'

const tracks = ref<Track[]>([])

const addTrackModal = ref<typeof AddTrackModal | null>()

const goToTrack = (id: string) => router.push(`/track/${id}`)

const handleDeleteTrack = (id: string) => {
  if (!confirm('Are you sure you want to delete this track?')) return
  deleteTrack(id)
  tracks.value = tracks.value.filter((track) => track._id !== id)
}

const trackCreated = async () => {
  addTrackModal?.value?.close()
  tracks.value = await getTracks()
}

const addTrackToPerformanceModal = ref<typeof AddTrackToPerformanceModal | null>()

const handleAddTrackToPerformance = (trackId: string, performanceId: string) => {
  addTrackToPerformanceModal.value?.closeModal()
  addTrackToPerformance(trackId, performanceId)
}

onMounted(async () => {
  tracks.value = await getTracks()
})
</script>

<template>
  <main class="relative mt-3 space-y-1 px-2">
    <h1 class="text-center text-3xl font-bold">Tracks</h1>
    <button
      @click="goToTrack(track._id)"
      v-for="track of tracks"
      :key="track._id"
      class="flex w-full justify-between rounded-sm border border-light p-4">
      <div class="flex flex-col">
        <p class="font-bold">{{ track.name }}</p>
        <p>Created by: {{ track.username }}</p>
      </div>
      <div class="flex gap-4">
        <button @click.stop="addTrackToPerformanceModal?.openModal(track._id)">
          <font-awesome-icon
            icon="fa-plus"
            size="lg" />
        </button>
        <button @click.stop="handleDeleteTrack(track._id)">
          <font-awesome-icon
            icon="fa-trash"
            class="text-danger" />
        </button>
      </div>
    </button>

    <!-- Open add track modal -->
    <button
      class="text-white absolute bottom-8 right-10 mt-4 rounded-sm bg-primary"
      @click="addTrackModal?.openModal">
      <font-awesome-icon
        icon="fa-plus-circle"
        class="scale-[300%]" />
    </button>

    <!-- Add track modal -->
    <Teleport to="body">
      <AddTrackModal
        ref="addTrackModal"
        @track-created="trackCreated" />

      <AddTrackToPerformanceModal
        ref="addTrackToPerformanceModal"
        @add-track-to-performance="handleAddTrackToPerformance" />
    </Teleport>
  </main>
</template>
