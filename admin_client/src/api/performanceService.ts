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

export const storePerformance = async (name: string) => {
  const response = await apiClient.post("/api/performance/create", {
    name,
  })
  return response.data
}

export const editPerformance = async (performanceId: string, name: string) => {
  await apiClient.post(`/api/performance/edit/${performanceId}`, {
    name,
  })
}

export const deletePerformance = async (performanceId: string) => {
  const response = await apiClient.post(
    `/api/performance/delete/${performanceId}`,
    {
      performanceId,
    }
  )
  return response
}

export const updateTrackPerformanceOrder = async (
  trackPerformances: TrackPerformanceIdAndSortOrder[]
) => {
  await apiClient.post("/api/track-performance/update-order", {
    trackPerformances,
  })
}

export const setStartTime = async (
  trackPerformanceId: string,
  startTime: number
) => {
  return await apiClient.post("/api/track-performance/set-start-time", {
    trackPerformanceId,
    startTime,
  })
}

export const addTracksToPerformance = async (
  performanceId: string,
  trackIds: string[]
) => {
  await apiClient.post("/api/add-tracks-to-performance", {
    trackIds,
    performanceId,
  })
}

export const deleteTrackFromPerformance = async (
  trackPerformanceId: string
) => {
  await apiClient.post("/api/track-performance/delete", {
    trackPerformanceId,
  })
}
