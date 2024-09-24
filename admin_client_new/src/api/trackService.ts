import { Track } from "../types"
import apiClient from "./axiosInstance"

export async function getTracks() {
  const response = await apiClient.get<{ tracks: Track[] }>("/api/tracks")

  return response.data.tracks
}
