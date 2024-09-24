import { InvalidInputError, ProcessingError } from '../errors'
import { Track, TrackPerformance } from '../models'
import { TrackDocument } from '../types/types'
import { readAndParseChunkFile } from './fileService'

export async function setStartTime(trackPerformanceId: string, startTime: number) {
  if (startTime < 0) {
    throw new InvalidInputError('startTime cannot be less than 0')
  }

  const trackPerformance = await TrackPerformance.findById(trackPerformanceId).populate('track')

  if (!trackPerformance) {
    throw new InvalidInputError('trackPerformanceId does not exist')
  }

  const trackLengthInChunks = trackPerformance.track.trackLengthInChunks

  if (trackLengthInChunks < startTime) {
    throw new InvalidInputError('startTime cannot be greater than track length')
  }

  trackPerformance.startTime = startTime
  await trackPerformance.save()

  return trackPerformance
}
