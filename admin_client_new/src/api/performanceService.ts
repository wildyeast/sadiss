import apiClient from "./axiosInstance"
import { SadissPerformance, TrackPerformanceIdAndSortOrder } from "../types"

export const getPerformances = async () => {
  const response = await apiClient.get<{ performances: SadissPerformance[] }>(
    "/api/performances"
  )
  return response.data.performances
}

export const getPerformance = async (id: string) => {
  const response = await apiClient.get<{ performance: SadissPerformance }>(
    `/api/performance/${id}`
  )
  return response.data.performance
}

export const getPerformanceWithTracks = async (id: string) => {
  const response = await apiClient.get<{ performance: SadissPerformance }>(
    `/api/performance/${id}/with-tracks`
  )
  return response.data.performance
}

export const updateTrackPerformanceOrder = async (
  trackPerformances: TrackPerformanceIdAndSortOrder[]
) => {
  await apiClient.post("/api/track-performance/update-order", {
    trackPerformances,
  })
}
