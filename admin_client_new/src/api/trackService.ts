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
