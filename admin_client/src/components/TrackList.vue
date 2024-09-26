<script setup lang="ts">
import { formatTime } from "../utils/formatTime"
import { Track } from "../types"
import TrashIcon from "../assets/trash.svg"
import { onMounted, ref, Ref } from "vue"
import { deleteTrack, getTracks } from "../api"
import { useI18n } from "vue-i18n"
import { useUserStore } from "../stores/useUserStore"

const { t } = useI18n()

const props = defineProps<{
  canDelete: boolean
  selectedTracks?: Track[]
}>()

const emit = defineEmits<{
  (e: "hasLoadedTracks"): void
}>()

const tracks: Ref<Track[] | null> = ref(null)

const loadTracks = async () => {
  tracks.value = await getTracks()
}

const userStore = useUserStore()
const loggedInUserIsOwnerOfTrack = (ownerId: string) => {
  return userStore.loggedInUserId === ownerId
}

const handleDeleteTrack = async (trackId: string) => {
  if (!tracks.value) return

  if (!confirm(t("confirm_delete_track"))) {
    return
  }

  try {
    await deleteTrack(trackId)
    tracks.value = tracks.value.filter(track => track._id !== trackId)
  } catch (error) {
    console.error(error)
  }
}

const selectTrack = (track: Track) => {
  if (!props.selectedTracks) return
  if (props.selectedTracks.includes(track)) {
    const index = props.selectedTracks.findIndex(t => t._id === track._id)
    props.selectedTracks.splice(index, 1)
  } else {
    props.selectedTracks.push(track)
  }
}

onMounted(async () => {
  await loadTracks()
  emit("hasLoadedTracks")
})
</script>
<template>
  <div v-if="tracks" class="list-container">
    <div
      v-for="track in tracks"
      :key="track._id"
      class="list-entry"
      :class="{
        'bg-secondary text-white !border-y-white':
          selectedTracks?.includes(track),
      }"
      @click="selectTrack(track)">
      <div class="flex justify-between">
        <div class="flex gap-4">
          <p>{{ track.name }}</p>
          <p>{{ formatTime(track.trackLengthInChunks) }}</p>
        </div>
        <div v-if="track.notes">
          <p>{{ track.notes }}</p>
        </div>
        <button
          v-if="canDelete && loggedInUserIsOwnerOfTrack(track.creator._id)"
          @click="handleDeleteTrack(track._id)">
          <TrashIcon />
        </button>
      </div>
    </div>
  </div>
</template>
