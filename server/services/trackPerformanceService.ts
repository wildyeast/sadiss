import { InvalidInputError } from '../errors'
import { TrackPerformance } from '../models'

export async function setStartTime(trackPerformanceId: string, startTime: number) {
  if (startTime < 0) {
    throw new InvalidInputError('startTime cannot be less than 0')
  }

  return await TrackPerformance.findByIdAndUpdate(trackPerformanceId, { startTime }, { new: true })
}
