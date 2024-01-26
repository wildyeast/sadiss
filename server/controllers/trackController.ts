import { Request, Response } from 'express'
// The following is a hack to get the types to work.
// See https://github.com/DefinitelyTyped/DefinitelyTyped/issues/47780#issuecomment-790684085
import { Multer } from 'multer' // Don't remove this line
type File = Express.Multer.File
import { chunk } from '../tools'
import { convertSrtToJson } from '../tools/convertSrtToJson'
import mongoose, { isValidObjectId } from 'mongoose'
import { TtsJson, TrackDocument } from '../types/types'
import { trackSchema } from '../models/track'
import { TrackPerformance } from '../models'
import { activePerformances, initializeActivePerformance } from '../services/activePerformanceService'
import path from 'path'
import fs from 'fs'
import { readAndParseChunkFile } from '../services/fileService'
import { logger } from '../tools'

const uuid = require('uuid')

const Track = mongoose.model('Track', trackSchema)

exports.loadTrackForPlayback = async (req: Request, res: Response) => {
  const { trackId, performanceId } = req.body

  if (!trackId || !isValidObjectId(trackId)) {
    return res.status(400).json({ message: 'Invalid trackId provided.' })
  }

  if (!performanceId || !isValidObjectId(performanceId)) {
    return res.status(400).json({ message: 'Invalid performanceId provided.' })
  }

  try {
    const track = await Track.findOne({ _id: trackId })

    if (!track) {
      return res.status(404).json({ message: 'Track not found.' })
    }

    const chunks = await readAndParseChunkFile(track)

    if (chunks) {
      const activePerformance = initializeActivePerformance(performanceId)
      activePerformance.loadTrack(chunks, track.mode, track.waveform, track.ttsRate)
      return res.status(200).json({ trackLengthInChunks: chunks.length })
    } else {
      return res.status(500).json({ message: 'Error loading track.' })
    }
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Error loading track.' })
  }
}

// Start track
exports.startTrack = async (req: Request, res: Response) => {
  const { trackId, performanceId, startTime, startAtChunk, loop } = req.body

  try {
    const activePerformance = initializeActivePerformance(performanceId)

    const trackStarted = activePerformance.startSendingInterval(startTime, req.wss, loop, trackId, startAtChunk)
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
    if (track.creator.toString() !== req.user!.id.toString()) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Delete TrackPerformances, if any
    const trackPerformances = await TrackPerformance.find({ track })
    for (const trackPerformance of trackPerformances) {
      await trackPerformance.remove()
    }

    deleteUploadedFiles(track)

    // Delete track
    await track.remove()

    res.status(200).json({ message: 'Track deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}

const deleteUploadedFiles = (track: TrackDocument) => {
  const uploadsDir = path.join(__dirname, `../${process.env.UPLOADS_DIR}`)
  const chunksDir = path.join(__dirname, `../${process.env.CHUNKS_DIR}`)

  // Delete files
  if (track.partialFile) {
    fs.unlinkSync(`${uploadsDir}/${track.partialFile.fileName}`)
  }

  track.ttsFiles.forEach((ttsFileObject) => {
    fs.unlinkSync(`${uploadsDir}/${ttsFileObject.fileName}`)
  })

  if (track.chunkFileName) {
    fs.unlinkSync(`${chunksDir}/${track.chunkFileName}`)
  }
}

exports.getTracks = async (req: Request, res: Response) => {
  try {
    const allTracks = await Track.find(
      { $or: [{ isPublic: true }, { creator: req.user!.id }] },
      '_id name notes mode waveform ttsRate creator isPublic partialFile ttsFiles'
    )
      .populate('creator', 'username') // Populate the 'creator' field with 'username'
      .lean()

    res.json({ tracks: allTracks })
  } catch (err) {
    res.status(500).json({ Error: 'Failed fetching tracks.' })
  }
}

exports.getTrack = async (req: Request, res: Response) => {
  try {
    const track = await Track.find({ _id: req.params.id }, '_id name notes mode waveform ttsRate partialFile ttsFiles')
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
    const { path, partialFileToSave } = handleUploadedPartialFile(<File[]>req.files)

    const { ttsFilesToSave, ttsLangs, ttsJson } = handleUploadedTtsFiles(<File[]>req.files)

    const filename = uuid.v4()
    const { partialsCount, chunks } = await chunk(path, ttsJson)
    fs.writeFile(`${process.env.CHUNKS_DIR}/${filename}`, JSON.stringify(chunks), (err: any) => {
      if (err) {
        console.error(err)
      }
    })

    const name = req.body.name
    const notes = req.body.notes
    const mode = req.body.mode
    const waveform = req.body.waveform
    const ttsRate = req.body.ttsRate
    const isPublic = req.body.isPublic === 'true'

    // Save track to DB
    const t = new Track({
      name,
      chunkFileName: filename,
      notes,
      mode,
      waveform,
      ttsRate,
      partialFile: partialFileToSave,
      ttsFiles: ttsFilesToSave,
      creator: req.user!.id,
      isPublic
    })

    if (mode === 'choir' && partialsCount > 0) {
      t.partialsCount = partialsCount
    }

    if (ttsLangs) {
      t.ttsLangs = Array.from(ttsLangs)
    }

    t.save((err) => {
      if (err) {
        logger.error('Failed uploading track with:', err)
        res.status(500).send(err)
      } else {
        res.status(201).send(t)
      }
    })
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
  if (Array.isArray(req.files)) {
    const uploadsDir = path.join(__dirname, `../${process.env.UPLOADS_DIR}`)
    req.files.forEach((file) => {
      fs.unlinkSync(`${uploadsDir}/${file.filename}`)
    })
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

    if (track.creator.toString() !== req.user!.id.toString()) {
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

const handleUploadedPartialFile = (files: File[]) => {
  const partialFilePrefix = 'partialfile_'
  const partialFile: File = Object.values(files).filter((file: File) => file.originalname.includes(partialFilePrefix))[0]
  let path
  const partialFileToSave = <{ origName: string; fileName: string }>{}

  if (partialFile) {
    path = partialFile.path
    const originalFileName = partialFile.originalname.replace(partialFilePrefix, '')
    partialFileToSave.origName = originalFileName + '.txt'
    partialFileToSave.fileName = partialFile.filename
  }

  return { path, partialFileToSave }
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
