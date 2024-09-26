import { defineStore } from "pinia"
import { Ref, ref } from "vue"
import { Track } from "../types"
import { getTracks } from "../api"

export const useTrackStore = defineStore("track", () => {
  const tracks: Ref<Track[]> = ref([])
  const loading = ref(false)

  const loadTracks = async () => {
    loading.value = true
    try {
      tracks.value = await getTracks()
    } catch (error) {
      console.error("Error loading tracks:", error)
    } finally {
      loading.value = false
    }
  }

  return {
    tracks,
    loading,
    loadTracks,
  }
})
