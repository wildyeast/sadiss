<script setup lang="ts">
import { onMounted, ref, Ref } from "vue"
import { getTracks, deleteTrack } from "../api"
import { Track } from "../types"
import { formatTime } from "../utils/formatTime"
import TrashIcon from "../assets/trash.svg"
import { useI18n } from "vue-i18n"

const { t } = useI18n()

const tracks: Ref<Track[]> = ref([])

const handleDeleteTrack = async (trackId: string) => {
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

const loadTracks = async () => {
  tracks.value = await getTracks()
}

onMounted(async () => {
  await loadTracks()
})
</script>

<template>
  <div class="w-full">
    <h1>{{ $t("track", 2) }}</h1>
    <div v-if="tracks" class="list-container">
      <div v-for="track in tracks" :key="track._id" class="list-entry">
        <div class="flex justify-between">
          <div class="flex gap-4">
            <p>{{ track.name }}</p>
            <p>{{ formatTime(track.trackLengthInChunks) }}</p>
          </div>
          <div v-if="track.notes">
            <p>{{ track.notes }}</p>
          </div>
          <button @click="handleDeleteTrack(track._id)">
            <TrashIcon />
          </button>
        </div>
      </div>
    </div>
    <RouterLink to="/tracks/new" class="button">
      {{ $t("add_track") }}
    </RouterLink>
  </div>
</template>
