// TrackService.ts

import { isValidObjectId, Types } from 'mongoose'
import { InvalidInputError } from '../errors/InvalidInputError'
import { NotFoundError } from '../errors/NotFoundError'
import { Track } from '../models'
import { readAndParseChunkFile } from './fileService'
import { ProcessingError } from '../errors/ProcessingError'
import { initializeActivePerformance } from './activePerformanceService'
import path from 'path'
import fs from 'fs'
import archiver from 'archiver'
import { error } from 'console'
import { logger } from '../tools'

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

  async getTrackDataForDownload(trackId: string) {
    const track = await Track.findOne(
      { _id: trackId },
      'name mode notes ttsInstructions ttsLangs waveform ttsRate ttsFiles partialFile isPublic'
    )

    if (!track) {
      throw new NotFoundError('Track not found.')
    }

    return track
  }

  async createTrackZip(trackId: string): Promise<string> {
    if (!isValidObjectId(trackId)) {
      throw new InvalidInputError('Invalid trackId provided.')
    }

    const track = await this.getTrackDataForDownload(trackId)
    const zipFilePath = path.join(process.cwd(), `public/${track.name.replace(' ', '_')}.zip`)
    const output = fs.createWriteStream(zipFilePath)
    const archive = archiver('zip', {
      zlib: { level: 9 }
    })

    return new Promise((resolve, reject) => {
      output.on('close', () => resolve(zipFilePath))
      archive.on('error', (err: Error) => reject(err))
      archive.on('warning', (err) => {
        if (err.code === 'ENOENT') {
          logger.warn('File not found', err)
        } else {
          logger.error('Error creating zip file', err)
          throw err
        }
      })

      archive.pipe(output)

      archive.append(JSON.stringify(track), { name: 'track.json' })

      const baseFilePath = path.join(process.cwd(), `${process.env.UPLOADS_DIR}`)

      console.log(track.ttsFiles)

      track.ttsFiles.forEach((file) => {
        // archive.append(file.fileName, { name: file.origName })
        const uniqueFileName = file.lang + '_' + file.voice + '_' + file.origName
        const filePath = path.join(baseFilePath, file.fileName)
        archive.append(fs.createReadStream(filePath), { name: uniqueFileName })
        console.log('file', file.origName)
      })

      // Get the file data from uploads folder
      const partialFilePath = path.join(baseFilePath, track.partialFile.fileName)
      archive.append(fs.createReadStream(partialFilePath), { name: track.partialFile.origName })
      console.log('file', track.partialFile.origName)

      archive.finalize()
    })
  }
}
