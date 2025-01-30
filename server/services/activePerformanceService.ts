import { ActivePerformance } from '../activePerformance'
import { Types } from 'mongoose'
import { Frame, TrackMode } from '../types'

export const activePerformances: ActivePerformance[] = []

/** Gets an active performance by its ID. */
export const getActivePerformance = (performanceId: Types.ObjectId): ActivePerformance | undefined => {
  return activePerformances.find((p) => p.id === performanceId)
}

/**
 * Initializes an active performance if it doesn't already exist. Returns said performance.
 * @param {string} performanceId - ID of the performance.
 * @return The active performance.
 */
export const initializeActivePerformance = (performanceId: Types.ObjectId): ActivePerformance => {
  let activePerformance = getActivePerformance(performanceId)
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

/**
 * Initializes an active performance and loads a track into it.
 * @param performanceId - ID of the performance
 * @param track - The track frames to load
 * @param mode - Track mode (choir/non-choir)
 * @param waveform - Type of waveform to use
 * @param ttsRate - Text-to-speech rate
 * @param startTime - Starting time position
 * @returns An initialized ActivePerformance instance with the track loaded
 */
export const initializeActivePerformanceAndLoadTrack = (
  performanceId: Types.ObjectId,
  track: Frame[],
  mode: TrackMode,
  waveform: OscillatorType,
  ttsRate: string,
  startTime: number
): ActivePerformance => {
  const activePerformance = initializeActivePerformance(performanceId)
  activePerformance.loadTrack(track, mode, waveform, ttsRate, startTime)
  return activePerformance
}
