import { TrackPerformance } from '../models/trackPerformance'
import { TrackPerformanceDocument } from '../types'
import { Types } from 'mongoose'

class TrackPerformanceRepository {
  async findByTrackAndPerformance(
    trackId: Types.ObjectId,
    performanceId: Types.ObjectId
  ): Promise<TrackPerformanceDocument | null> {
    return TrackPerformance.findOne({ track: trackId, performance: performanceId })
  }
}

export const trackPerformanceRepository = new TrackPerformanceRepository()
