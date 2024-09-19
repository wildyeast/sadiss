import apiClient from "./axiosInstance"
import { SadissPerformance } from "../types"

export const getPerformances = async () => {
  const response = await apiClient.get<{ performances: SadissPerformance[] }>(
    "/api/performances"
  )
  return response.data.performances
}
