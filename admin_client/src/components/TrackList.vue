<script setup lang="ts">
import { formatTime } from "../utils/formatTime"
import { Track } from "../types"
import IconTrash from "../assets/trash.svg"
import IconDownload from "../assets/download.svg"
import IconEdit from "../assets/edit.svg"
import IconInfo from "../assets/info.svg"
import { onMounted } from "vue"
import { deleteTrack, downloadTrack } from "../api"
import { useI18n } from "vue-i18n"
import { useUserStore } from "../stores/useUserStore"
import { useTrackStore } from "../stores/useTrackStore"

const { t } = useI18n()

const props = defineProps<{
  noOptions: boolean
  selectedTracks?: Track[]
}>()

const trackStore = useTrackStore()

const userStore = useUserStore()
const loggedInUserIsOwnerOfTrack = (ownerId: string) => {
  return userStore.loggedInUserId === ownerId
}

const handleDeleteTrack = async (trackId: string) => {
  if (!trackStore.tracks) return

  if (!confirm(t("confirm_delete_track"))) {
    return
  }

  try {
    await deleteTrack(trackId)
    trackStore.tracks = trackStore.tracks.filter(track => track._id !== trackId)
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

const handleDownloadTrack = async (trackId: string) => {
  if (!trackStore.tracks) return

  const track = trackStore.tracks.find(track => track._id === trackId)
  if (!track) return

  try {
    await downloadTrack(trackId, track.name)
  } catch (error) {
    console.error("Error downloading track:", error)
  }
}

onMounted(async () => {
  trackStore.loadTracks()
})
</script>
<template>
  <div v-if="trackStore.tracks" class="list-container">
    <div
      v-for="track in trackStore.tracks"
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
        <div class="flex gap-6 items-center">
          <RouterLink
            v-if="noOptions"
            :to="{ name: 'ViewTrack', params: { trackId: track._id } }">
            <IconInfo />
          </RouterLink>
          <RouterLink
            v-if="noOptions && loggedInUserIsOwnerOfTrack(track.creator._id)"
            :to="{ name: 'EditTrack', params: { trackId: track._id } }">
            <IconEdit />
          </RouterLink>
          <button @click="handleDownloadTrack(track._id)" v-if="noOptions">
            <IconDownload />
          </button>
          <button
            v-if="noOptions && loggedInUserIsOwnerOfTrack(track.creator._id)"
            @click="handleDeleteTrack(track._id)">
            <IconTrash />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
