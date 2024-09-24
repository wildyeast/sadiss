import { InvalidInputError, ProcessingError } from '../errors'
import { TrackPerformance } from '../models'
import { readAndParseChunkFile } from './fileService'

export async function setStartTime(trackPerformanceId: string, startTime: number) {
  if (startTime < 0) {
    throw new InvalidInputError('startTime cannot be less than 0')
  }

  const trackPerformance = await TrackPerformance.findById(trackPerformanceId).populate('track')

  if (!trackPerformance) {
    throw new InvalidInputError('trackPerformanceId does not exist')
  }

  const chunks = await readAndParseChunkFile(trackPerformance.track)

  if (!chunks) {
    throw new ProcessingError('Error loading track')
  }

  const trackLength = chunks.length

  if (trackLength && trackLength < startTime) {
    throw new InvalidInputError('startTime cannot be greater than track length')
  }

  trackPerformance.startTime = startTime
  await trackPerformance.save()

  return trackPerformance
}
