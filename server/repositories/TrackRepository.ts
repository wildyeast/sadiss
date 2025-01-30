import { Track } from '../models/track'
import { TrackDocument } from '../types'
import { Types } from 'mongoose'
class TrackRepository {
  async findById(trackId: Types.ObjectId): Promise<TrackDocument | null> {
    return Track.findOne({ _id: trackId })
  }
}

export const trackRepository = new TrackRepository()
