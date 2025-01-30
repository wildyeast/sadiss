import { NextFunction, Request, Response } from 'express'
// The following is a hack to get the types to work.
// See https://github.com/DefinitelyTyped/DefinitelyTyped/issues/47780#issuecomment-790684085
import { Multer } from 'multer' // Don't remove this line
type File = Express.Multer.File
import { chunk } from '../tools'
import { convertSrtToJson } from '../tools/convertSrtToJson'
import mongoose, { isValidObjectId } from 'mongoose'
import { TtsJson } from '../types'
import { trackSchema } from '../models/track'
import { TrackPerformance } from '../models'
import { activePerformances, initializeActivePerformance } from '../services/activePerformanceService'
import path from 'path'
import fs from 'fs'
import { logger } from '../tools'
import {
  createTrack,
  createTrackZip,
  getTrackDataForDownload,
  getTracks,
  loadTrackForPlayback,
  uploadTrackFromJson
} from '../services/trackService'
import { InvalidInputError } from '../errors/InvalidInputError'
import { NotFoundError } from '../errors/NotFoundError'
import { ProcessingError } from '../errors/ProcessingError'
import { ForbiddenError } from '../errors/ForbiddenError'
import unzipper from 'unzipper'
import { getPartialFileByPrefix } from '../services/fileService'

const uuid = require('uuid')

const Track = mongoose.model('Track', trackSchema)

exports.loadTrackForPlayback = async (req: Request, res: Response, next: NextFunction) => {
  const { trackId, performanceId } = req.body

  try {
    const result = await loadTrackForPlayback(trackId, performanceId)
    return res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

exports.startTrack = async (req: Request, res: Response) => {
  const { trackId, performanceId, startTime, startAtChunk, loop } = req.body

  try {
    const activePerformance = initializeActivePerformance(performanceId)

    const trackStarted = activePerformance.startSendingInterval(startTime, req.wss, loop, trackId)
    if (trackStarted) {
      res.json({ data: 'Track started.' })
    } else {
      res.json({ data: 'Track already running.' })
    }
  } catch (err) {
    res.status(500).json({ error: err })
  }
}

exports.deleteTrack = async (req: Request, res: Response) => {
  try {
    const track = await Track.findById(req.params.id)

    if (!track) {
      return res.status(404).json({ error: 'Track not found' })
    }

    // Check if user owns track
    if (track.creator.toString() !== req.user!._id.toString()) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Soft delete TrackPerformances, if any
    const trackPerformances = await TrackPerformance.find({ track })
    for (const trackPerformance of trackPerformances) {
      trackPerformance.deleted = true
      trackPerformance.deletedAt = new Date()
      trackPerformance.deletedBy = req.user!._id
      trackPerformance.save()
    }

    // Soft delete track
    track.deleted = true
    track.deletedAt = new Date()
    track.deletedBy = req.user!._id
    track.save()

    res.status(200).json({ message: 'Track deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}

exports.getTracks = async (req: Request, res: Response) => {
  try {
    const allTracks = await getTracks(req.user!._id)
    res.json({ tracks: allTracks })
  } catch (err) {
    res.status(500).json({ Error: 'Failed fetching tracks.' })
  }
}

exports.getTrack = async (req: Request, res: Response) => {
  try {
    const track = await Track.find(
      { _id: req.params.id, deleted: { $ne: true } },
      '_id name notes mode waveform ttsRate partialFile ttsFiles'
    )

    if (!track.length) {
      res.status(404).json({ error: 'Track not found' })
      return
    }
    res.json(track)
  } catch (err) {
    logger.error('Failed getting track with:', err)
    res.status(500).json({ Error: 'Failed fetching track.' })
  }
}

exports.uploadTrack = async (req: Request, res: Response) => {
  const validationFailedMessage = validateInputsForUpload(req)

  if (validationFailedMessage) {
    if (req.files && req.files.length) {
      deleteFilesIfValidationFailed(req)
    }
    res.status(400).send({ message: validationFailedMessage })
    return
  }

  try {
    const partialFilePrefix = 'partialfile_'

    const partialFileInfo = getPartialFileByPrefix(<File[]>req.files, partialFilePrefix)

    const { ttsFilesToSave, ttsLangs, ttsJson } = handleUploadedTtsFiles(<File[]>req.files)

    const filename = uuid.v4()

    const { partialsCount, chunks } = await chunk(partialFileInfo?.path, ttsJson)

    fs.writeFile(`${process.env.CHUNKS_DIR}/${filename}`, JSON.stringify(chunks), (err: any) => {
      if (err) {
        console.error(err)
        throw new ProcessingError('Failed writing chunks.')
      }
    })

    const name = req.body.name
    const notes = req.body.notes
    const mode = req.body.mode
    const waveform = req.body.waveform
    const ttsRate = req.body.ttsRate
    const isPublic = req.body.isPublic === 'true'
    const trackLengthInChunks = chunks.length

    const track = await createTrack(
      filename,
      name,
      mode,
      notes,
      ttsLangs,
      waveform,
      ttsRate,
      ttsFilesToSave,
      partialFileInfo,
      partialsCount,
      isPublic,
      req.user!._id,
      trackLengthInChunks
    )

    res.status(201).json(track)
  } catch (err) {
    logger.error('Failed uploading track with:', err)
    res.status(500).send(err)
  }
}

const validateInputsForUpload = (req: Request) => {
  if (!req.files || !req.files.length) {
    return 'No files were uploaded.'
  }

  if (!req.body.name) {
    return 'No name provided.'
  }

  if (!req.body.mode) {
    return 'No mode provided.'
  }

  if (!req.body.waveform) {
    return 'No waveform provided.'
  }

  return null
}

const deleteFilesIfValidationFailed = (req: Request) => {
  try {
    if (Array.isArray(req.files)) {
      const uploadsDir = path.join(__dirname, `../${process.env.UPLOADS_DIR}`)
      req.files.forEach((file) => {
        fs.unlinkSync(`${uploadsDir}/${file.filename}`)
      })
    }
  } catch (err) {
    logger.error('Failed deleting files with:', err)
  }
}

exports.editTrack = async (req: Request, res: Response) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      res.status(400).send({ error: 'Invalid track id.' })
      return
    }

    const track = await Track.findById(req.params.id)
    if (!track) {
      res.status(404).send({ error: 'Track not found.' })
      return
    }

    if (track.creator.toString() !== req.user!._id.toString()) {
      res.status(403).send({ error: 'Forbidden.' })
      return
    }

    const patch = req.body

    // Editing track currently disabled since it doesn't work correctly
    // see https://github.com/wildyeast/sadiss/issues/71#issuecomment-1587183286 for more information
    // TODO: Fix this
    // const { path, partialFileToSave } = handleUploadedPartialFile(<File[]>req.files)
    // if (Object.keys(partialFileToSave).length) {
    //   patch.partialFile = partialFileToSave
    // }

    // const { ttsFilesToSave, ttsLangs, ttsJson } = handleUploadedTtsFiles(<File[]>req.files)
    // if (ttsFilesToSave.length && ttsLangs) {
    //   patch.ttsFiles = ttsFilesToSave
    //   patch.ttsLangs = Array.from(ttsLangs)
    // }

    // const { partialsCount, chunks } = await chunk(path, ttsJson)

    // if (Object.keys(chunks)) {
    //   const filename = uuid.v4()
    //   fs.writeFile(`${process.env.CHUNKS_DIR}/${filename}`, JSON.stringify(chunks), (err: any) => {
    //     if (err) {
    //       console.error(err)
    //     }
    //   })
    // }

    // if (partialsCount > 0 && patch.mode === 'choir') {
    //   patch.partialsCount = partialsCount
    // } else {
    //   patch.partialsCount = undefined
    // }

    // patch.chunks = JSON.stringify(chunks)

    track.set(patch)

    track.save((err, updatedTrack) => {
      if (err) {
        res.status(500).send({ error: err.message })
      } else {
        res.json(updatedTrack)
      }
    })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
}

exports.stopTrack = (req: Request, res: Response) => {
  const performance = activePerformances.find((p) => p.id === req.body.performanceId)
  if (performance) {
    performance.stopSendingInterval()
    res.send({ message: 'Track stopped.' })
  } else {
    res.status(404).send({ message: 'Performance not found.' })
  }
}

const handleUploadedTtsFiles = (files: File[]) => {
  const ttsFilePrefix = 'ttsfile_'
  const ttsFiles = Object.values(files).filter((file: File) => file.originalname.includes(ttsFilePrefix))
  let ttsLangs: Set<string> | undefined
  let ttsJson: TtsJson | undefined
  let ttsFilesToSave: { origName: string; fileName: string }[] = []
  if (ttsFiles.length) {
    ;({ ttsLangs, ttsJson } = convertSrtToJson(ttsFiles))
    ttsFilesToSave = ttsFiles.map((file: File) => {
      const [_, voice, lang, origName] = file.originalname.split('_')
      return {
        voice,
        lang,
        origName: origName + '.txt', // Add .txt even if original was .srt
        fileName: file.filename
      }
    })
  }
  return { ttsFilesToSave, ttsLangs, ttsJson }
}

exports.downloadTrack = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!isValidObjectId(req.params.trackId)) {
      res.status(400).send({ error: 'Invalid track id.' })
      return
    }

    const trackDataForDownload = await getTrackDataForDownload(req.params.trackId)

    if (req.user!._id.toString() !== trackDataForDownload.creator.toString() && !trackDataForDownload.isPublic) {
      throw new ForbiddenError('Forbidden.')
    }

    const zipFilePath = await createTrackZip(trackDataForDownload)

    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename="${trackDataForDownload.name.replace(' ', '_')}.zip"`)

    res.download(zipFilePath, (err) => {
      if (err) {
        logger.error('Failed downloading track with:', err)
        res.status(500).send({ error: 'Failed downloading track.' })
      }
    })

    // setTimeout(() => {
    //   fs.unlink(zipFilePath, (err) => {
    //     if (err) {
    //       logger.error('Failed deleting zip file with:', err)
    //     }
    //   })
    // }, 10000)
  } catch (err: any) {
    next(err)
  }
}

exports.uploadZip = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.headers.cookie) {
    throw new ForbiddenError('Forbidden.')
  }

  if (!req.file) {
    throw new InvalidInputError('No file uploaded.')
  }

  const extractPath = path.join(process.cwd(), 'public', `${uuid.v4()}`)

  if (!fs.existsSync(extractPath)) {
    fs.mkdirSync(extractPath, { recursive: true })
  }

  const zipFilePath = req.file.path

  try {
    await fs
      .createReadStream(zipFilePath)
      .pipe(unzipper.Extract({ path: extractPath }))
      .promise()

    const trackJsonPath = path.join(extractPath, 'track.json')

    if (!fs.existsSync(trackJsonPath)) {
      throw new ProcessingError('No track.json found in zip file.')
    }

    const uploadSuccessful = await uploadTrackFromJson(
      trackJsonPath,
      extractPath,
      process.env.API_BASE_URL + '/api/track/create',
      req.headers.cookie
    )

    if (uploadSuccessful) {
      res.status(201).send({ message: 'Track uploaded successfully.' })
    } else {
      throw new ProcessingError('Error uploading track.')
    }
  } catch (err: any) {
    next(err)
  }
}
