import { Track } from "../types"
import apiClient from "./axiosInstance"

export async function getTracks() {
  const response = await apiClient.get<{ tracks: Track[] }>("/api/tracks")

  return response.data.tracks
}

export async function storeTrack(track: FormData) {
  const response = await apiClient.post<{ track: Track }>(
    "/api/track/create",
    track
  )

  return response.data!.track
}

export async function deleteTrack(trackId: string) {
  const response = await apiClient.post<{ message: string }>(
    `/api/track/delete/${trackId}`
  )

  return response.data.message
}

export async function downloadTrack(trackId: string, trackName: string) {
  const response = await apiClient.get("/api/track/download/" + trackId, {
    responseType: "blob",
  })

  const blob = await response.data
  const downloadUrl = window.URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.href = downloadUrl
  link.download = `${trackName.replace(" ", "_")}.zip`
  document.body.appendChild(link)
  link.click()

  document.body.removeChild(link)
  window.URL.revokeObjectURL(downloadUrl)
}

export async function uploadTrackZip(trackZip: FormData) {
  const response = await apiClient.post<{ track: Track }>(
    "/api/track/upload-zip",
    trackZip
  )
  return response.data!.track
}
