<script setup lang="ts">
import { onMounted, ref, Ref } from "vue"
import { getTracks } from "../api"
import { Track } from "../types"
import { formatTime } from "../utils/formatTime"

const tracks: Ref<Track[]> = ref([])

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
      <button v-for="track in tracks" :key="track._id" class="list-entry">
        <div>
          <div class="flex">
            <p>{{ track.name }}</p>
            <p>{{ formatTime(track.trackLengthInChunks) }}</p>
          </div>
          <div v-if="track.notes">
            <p>{{ track.notes }}</p>
          </div>
        </div>
      </button>
    </div>
    <RouterLink to="/tracks/new" class="button">
      {{ $t("add_track") }}
    </RouterLink>
  </div>
</template>
