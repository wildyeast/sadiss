import { ActivePerformance } from '../activePerformance'
import { Types } from 'mongoose'

export const activePerformances: ActivePerformance[] = []

/**
 * Initializes an active performance if it doesn't already exist. Returns said performance.
 * @param {string} performanceId - ID of the performance.
 * @return The active performance.
 */
export const initializeActivePerformance = (performanceId: Types.ObjectId) => {
  let activePerformance = activePerformances.find((p) => p.id === performanceId)
  if (!activePerformance) {
    activePerformance = new ActivePerformance(performanceId)
    activePerformances.push(activePerformance)
  }
  return activePerformance
}

/**
 * Unloads the loaded track from an active performance.
 * @param {string} performanceId - ID of the performance.
 */
export const unloadTrackFromActivePerformance = (performanceId: Types.ObjectId) => {
  const activePerformance = activePerformances.find((p) => p.id === performanceId)
  if (activePerformance) {
    activePerformance.unloadTrack()
  }
}
