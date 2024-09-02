// TrackService.ts

import { isValidObjectId, Types } from 'mongoose'
import { InvalidInputError } from '../errors/InvalidInputError'
import { NotFoundError } from '../errors/NotFoundError'
import { Track } from '../models'
import { readAndParseChunkFile } from './fileService'
import { ProcessingError } from '../errors/ProcessingError'
import { initializeActivePerformance } from './activePerformanceService'

export class TrackService {
  async loadTrackForPlayback(trackId: string, performanceId: Types.ObjectId) {
    if (!isValidObjectId(trackId)) {
      throw new InvalidInputError('Invalid trackId provided.')
    }

    if (!isValidObjectId(performanceId)) {
      throw new InvalidInputError('Invalid performanceId provided.')
    }

    const track = await Track.findOne({ _id: trackId })
    if (!track) {
      throw new NotFoundError('Track not found.')
    }

    const chunks = await readAndParseChunkFile(track)
    if (!chunks) {
      throw new ProcessingError('Error loading track.')
    }

    const activePerformance = initializeActivePerformance(performanceId)
    activePerformance.loadTrack(chunks, track.mode, track.waveform, track.ttsRate)

    return { trackLengthInChunks: chunks.length }
  }
}
