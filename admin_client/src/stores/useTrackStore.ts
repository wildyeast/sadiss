import { defineStore } from "pinia"
import { computed, Ref, ref } from "vue"
import { Track } from "../types"
import { getTracks } from "../api"

export const useTrackStore = defineStore("track", () => {
  const tracks: Ref<Track[]> = ref([])

  let currentLoading = false
  const loading = computed(() => tracks.value.length === 0 && currentLoading)

  const loadTracks = async () => {
    currentLoading = true
    try {
      tracks.value = await getTracks()
    } catch (error) {
      console.error("Error loading tracks:", error)
    } finally {
      currentLoading = false
    }
  }

  const getTrackById = (trackId: string) => {
    return tracks.value.find(track => track._id === trackId)
  }

  return {
    tracks,
    loading,
    loadTracks,
    getTrackById,
  }
})
