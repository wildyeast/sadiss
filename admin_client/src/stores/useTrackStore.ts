import { defineStore } from "pinia"
import { computed, Ref, ref } from "vue"
import { Track } from "../types"
import { getTracks } from "../api"

export const useTrackStore = defineStore("track", () => {
  // Do not modify this array, it is used to store the original tracks
  const originalTracks: Ref<Track[]> = ref([])

  const tracks: Ref<Track[]> = ref([])

  let currentLoading = false
  const loading = computed(
    () => originalTracks.value.length === 0 && currentLoading
  )

  const loadTracks = async () => {
    currentLoading = true
    try {
      const loadedTracks = await getTracks()
      originalTracks.value = loadedTracks
      tracks.value = loadedTracks
    } catch (error) {
      console.error("Error loading tracks:", error)
    } finally {
      currentLoading = false
    }
  }

  const filterTracks = (query: string) => {
    tracks.value = originalTracks.value.filter(
      track =>
        track.name.toLowerCase().includes(query.toLowerCase()) ||
        track.creator.username.toLowerCase().includes(query.toLowerCase()) ||
        (track.notes && track.notes.toLowerCase().includes(query.toLowerCase()))
    )
  }

  const filterTracksByUser = (userId: string) => {
    tracks.value = originalTracks.value.filter(
      track => track.creator._id === userId
    )
  }

  const getTrackById = (trackId: string) => {
    return tracks.value.find(track => track._id === trackId)
  }

  return {
    tracks,
    loading,
    loadTracks,
    getTrackById,
    filterTracks,
    filterTracksByUser,
  }
})
