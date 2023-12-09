import { ActivePerformance } from '../activePerformance'

export const activePerformances: ActivePerformance[] = []

/**
 * Initializes an active performance if it doesn't already exist. Returns said performance.
 * @param {string} performanceId - ID of the performance.
 * @return {ActivePerformance} The active performance.
 */
export const initializeActivePerformance = (performanceId: string) => {
  // Check if performance already exists
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
export const unloadTrackFromActivePerformance = (performanceId: string) => {
  const activePerformance = activePerformances.find((p) => p.id === performanceId)
  if (activePerformance) {
    activePerformance.unloadTrack()
  }
}
