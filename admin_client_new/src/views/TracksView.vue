<script setup lang="ts">
import { onMounted, ref, Ref } from "vue"
import { getTracks } from "../api"
import { Track } from "../types"

const tracks: Ref<Track[]> = ref([])

const loadTracks = async () => {
  tracks.value = await getTracks()
}

onMounted(() => {
  loadTracks()
})
</script>

<template>
  <div class="w-full">
    <h1>{{ $t("track", 2) }}</h1>
    <div v-if="tracks" class="list-container">
      <button v-for="track in tracks" :key="track._id" class="list-entry">
        {{ track }}
        {{ track.name }}
      </button>
    </div>
  </div>
</template>
