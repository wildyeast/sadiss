<script setup lang="ts">
import { getTracks, deleteTrack, addTrackToPerformance } from '@/services/api'
import type { Track } from '@/types/types'
import { onMounted, ref } from 'vue'
import AddTrackModal from '@/components/AddTrackModal.vue'
import AddTrackToPerformanceModal from '@/components/AddTrackToPerformanceModal.vue'
import FixedViewHeader from '@/components/FixedViewHeader.vue'

const tracks = ref<Track[]>([])

const addTrackModal = ref<typeof AddTrackModal | null>()

const handleDeleteTrack = (id: string) => {
  if (!confirm('Are you sure you want to delete this track?')) return
  deleteTrack(id)
  tracks.value = tracks.value.filter((track) => track._id !== id)
}

const trackCreated = async () => {
  addTrackModal?.value?.closeModal()
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
  <main class="flex flex-col">
    <FixedViewHeader title="Tracks">
      <div class="flex flex-row-reverse">
        <!-- Open add track modal -->
        <button
          class="rounded-sm bg-light px-4 py-2 font-bold text-primary"
          @click.stop="addTrackModal?.openModal">
          Add track
        </button>
      </div>
    </FixedViewHeader>

    <div class="mt-12 space-y-2 overflow-y-auto pt-16">
      <button
        @click="addTrackModal?.openModal(track)"
        v-for="track of tracks"
        :key="track._id"
        class="flex w-full justify-between rounded-sm border border-light p-4">
        <div class="flex flex-col">
          <p class="font-bold">{{ track.name }}</p>
          <div>
            <span>Created by: {{ track.username }}</span>
          </div>
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
    </div>

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
