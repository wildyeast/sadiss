<script setup lang="ts">
import { getTracks, deleteTrack, addTrackToPerformance, downloadTrack, uploadTrackZip } from '@/services/api'
import type { Track } from '@/types/types'
import { onMounted, ref, computed } from 'vue'
import AddTrackModal from '@/components/AddTrackModal.vue'
import AddTrackToPerformanceModal from '@/components/AddTrackToPerformanceModal.vue'
import FixedViewHeader from '@/components/FixedViewHeader.vue'
import { useStore } from '@/stores/store'

const store = useStore()

const tracks = ref<Track[]>([])
const filterTracksBy = ref<'all' | 'own' | 'public'>()

const tracksToDisplay = computed(() => {
  switch (filterTracksBy.value) {
    case 'all':
      localStorage.setItem('filterTracksBy', 'all')
      return tracks.value
    case 'own':
      localStorage.setItem('filterTracksBy', 'own')
      return tracks.value.filter((track) => track.creator.username === store.userName)
    case 'public':
      localStorage.setItem('filterTracksBy', 'public')
      return tracks.value.filter((track) => track.isPublic)
    default:
      return tracks.value
  }
})

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

const handleAddTrackToPerformance = async (trackId: string, performanceId: string) => {
  try {
    await addTrackToPerformance(trackId, performanceId)
    addTrackToPerformanceModal.value?.closeModal()
  } catch (err) {
    alert(err)
  }
}

const handleDownloadTrack = async (trackId: string) => {
  const track = tracks.value.find((track) => track._id === trackId)
  if (!track) return

  try {
    await downloadTrack(trackId, track.name)
  } catch (error) {
    console.error('Error downloading track:', error)
  }
}

const handleUploadZip = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!target.files?.length) return

  const file = target.files[0]
  const formData = new FormData()
  formData.append('zip', file)

  try {
    await uploadTrackZip(formData)
    tracks.value = await getTracks()
    // reload page to see the new tracks
    location.reload()
  } catch (error) {
    console.error('Error uploading zip:', error)
  }
}

onMounted(async () => {
  tracks.value = await getTracks()
  const filterTracksByFromLocalStorage = localStorage.getItem('filterTracksBy')
  if (filterTracksByFromLocalStorage) {
    filterTracksBy.value = filterTracksByFromLocalStorage as 'all' | 'own' | 'public'
  } else {
    filterTracksBy.value = 'all'
  }
})
</script>

<template>
  <main class="flex flex-col">
    <FixedViewHeader title="Tracks">
      <div class="flex flex-row-reverse gap-2">
        <!-- Open add track modal -->
        <button
          class="rounded-sm bg-light px-4 py-2 font-bold text-primary"
          @click.stop="addTrackModal?.openModal">
          Add track
        </button>
        <select
          v-model="filterTracksBy"
          class="rounded-sm bg-light px-4 py-2 font-bold text-primary">
          <option value="all">All tracks</option>
          <option value="own">My tracks</option>
          <option value="public">Public tracks</option>
        </select>
        <!-- Upload zip (for testing only) -->
        <div class="flex items-center">
          <label
            for="zip"
            class="cursor-pointer rounded-sm bg-light px-4 py-2 font-bold text-primary">
            Upload zip
          </label>
          <input
            id="zip"
            type="file"
            accept=".zip"
            class="hidden"
            @change="handleUploadZip($event)" />
        </div>
      </div>
    </FixedViewHeader>

    <div class="mt-12 space-y-2 overflow-y-auto pt-16">
      <!-- Tracks -->
      <div
        v-for="track of tracksToDisplay"
        :key="track._id"
        class="flex w-full justify-between rounded-sm border border-light p-4">
        <div class="flex flex-col items-start gap-2">
          <div class="flex gap-2">
            <p class="font-bold">{{ track.name }}</p>
            |
            <span
              v-if="track.isPublic"
              title="Track is public">
              <font-awesome-icon icon="fa-user-group" /> |
            </span>
            <span
              v-if="track.mode === 'choir'"
              title="Track is for choirs">
              <font-awesome-icon icon="fa-people-group" />
            </span>
            <span
              v-if="track.partialFile"
              title="Track has partials">
              <font-awesome-icon icon="fa-music" />
            </span>
            <span v-if="track.partialFile">
              {{ track.waveform }}
            </span>
            <span
              v-if="track.ttsFiles?.length"
              title="Track has TTS">
              <font-awesome-icon icon="fa-comments" />
            </span>
            <span
              v-if="track.ttsFiles?.length"
              title="Track has TTS Rate of">
              {{ track.ttsRate }}
            </span>
          </div>
          <span>Created by: {{ track.creator.username }}</span>
          <span v-if="track.notes">{{ track.notes }}</span>
        </div>
        <div class="flex gap-4">
          <button @click.stop="handleDownloadTrack(track._id)">Download</button>
          <button
            v-if="track.creator.username === store.userName"
            @click.stop="handleDeleteTrack(track._id)"
            title="Delete track">
            <font-awesome-icon
              icon="fa-trash"
              class="text-danger"
              size="lg" />
          </button>
          <button
            v-if="track.creator.username === store.userName"
            @click.stop="addTrackModal?.openModal(track)"
            title="Edit track">
            <font-awesome-icon
              icon="fa-edit"
              size="lg" />
          </button>
          <button
            @click.stop="addTrackToPerformanceModal?.openModal(track._id)"
            title="Add track to performance">
            <font-awesome-icon
              icon="fa-plus"
              size="xl" />
          </button>
        </div>
      </div>
    </div>

    <!-- Add track modal -->
    <Teleport to="body">
      <AddTrackModal
        ref="addTrackModal"
        @track-created="trackCreated" />

      <AddTrackToPerformanceModal
        ref="addTrackToPerformanceModal"
        @add-tracks-to-performance="handleAddTrackToPerformance" />
    </Teleport>
  </main>
</template>
