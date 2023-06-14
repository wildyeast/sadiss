import { Request, Response } from 'express'
// The following is a hack to get the types to work.
// See https://github.com/DefinitelyTyped/DefinitelyTyped/issues/47780#issuecomment-790684085
import { Multer } from 'multer'
type File = Express.Multer.File
import { chunk } from '../tools'
import { convertSrtToJson } from '../tools/convertSrtToJson'
import mongoose from 'mongoose'
import { TtsJson } from '../types/types'
import { Server } from 'ws'
import { trackSchema } from '../models/track'
import { ActivePerformance } from '../activePerformance'
import { TrackPerformance } from '../models'

const fs = require('fs')
const uuid = require('uuid')

const Track = mongoose.model('Track', trackSchema)

let wss: Server

const activePerformances: ActivePerformance[] = []

// Start track
exports.startTrack = async (req: Request, res: Response) => {
  wss = req.wss

  const { trackId, performanceId, startTime, loop } = req.body

  try {
    const t = await Track.findById(trackId)
    if (t) {
      let chunks
      fs.readFile(`chunks/${t.chunkFileName}`, 'utf8', (err: any, data: string) => {
        if (err) {
          console.error(err)
          return
        }
        chunks = JSON.parse(data)
        if (!chunks) {
          throw new Error('Chunks undefined')
        }

        // Check if performance already exists
        let performance = activePerformances.find((p) => p.id === performanceId)
        if (!performance) {
          performance = new ActivePerformance(performanceId)
          activePerformances.push(performance)
        }

        const trackStarted = performance.startSendingInterval(
          chunks,
          // @ts-ignore TODO
          t.mode,
          t.waveform,
          t.ttsRate,
          startTime,
          req.wss,
          loop,
          trackId
        )
        if (trackStarted) {
          res.json({ data: 'Track started.' })
        } else {
          res.json({ data: 'Track already running.' })
        }
      })
    }
  } catch (err) {
    res.status(500).json({ error: err })
  }
}

exports.get_stats = async (req: Request, res: Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*') // cors error without this
  if (!wss) {
    res.json({ error: 'WSS object undefined.' })
    return
  }
  res.json({ clients: wss.clients.size })
}

exports.deleteTrack = async (req: Request, res: Response) => {
  try {
    const track = await Track.findById(req.params.id)

    if (!track) {
      return res.status(404).json({ error: 'Track not found' })
    }

    // Check if user owns track
    if (track.userId !== req.user!.id) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Delete TrackPerformances, if any
    const trackPerformances = await TrackPerformance.find({ trackId: track._id })
    for (const trackPerformance of trackPerformances) {
      await trackPerformance.remove()
    }

    // Delete track
    await track.remove()

    res.status(200).json({ message: 'Track deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}

exports.getTracks = async (req: Request, res: Response) => {
  // res.setHeader('Access-Control-Allow-Origin', '*') // cors error without this
  try {
    const allTracks = await Track.find(
      { $or: [{ isPublic: true }, { userId: req.user!.id }] },
      '_id name notes mode waveform ttsRate userId isPublic partialFile ttsFiles'
    )
    res.json({ tracks: allTracks })
  } catch (err) {
    console.log('Failed getting tracks with:', err)
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
    console.log('Failed getting track with:', err)
    res.status(500).json({ Error: 'Failed fetching track.' })
  }
}

exports.uploadTrack = async (req: Request, res: Response) => {
  if (!req.files || !req.files.length) {
    res.status(400).json({ error: 'No files were uploaded.' })
    return
  }

  if (!req.body.name) {
    res.status(400).json({ error: 'No name provided.' })
    return
  }

  if (!req.body.mode) {
    res.status(400).json({ error: 'No mode provided.' })
    return
  }

  if (!req.body.waveform) {
    res.status(400).json({ error: 'No waveform provided.' })
    return
  }

  try {
    const { path, partialFileToSave } = handleUploadedPartialFile(<File[]>req.files)

    const { ttsFilesToSave, ttsLangs, ttsJson } = handleUploadedTtsFiles(<File[]>req.files)

    const filename = uuid.v4()
    const { partialsCount, chunks } = await chunk(path, ttsJson)
    fs.writeFile(`chunks/${filename}`, JSON.stringify(chunks), (err: any) => {
      if (err) {
        console.error(err)
      }
    })

    const name = req.body.name
    const notes = req.body.notes
    const mode = req.body.mode
    const waveform = req.body.waveform
    const ttsRate = req.body.ttsRate
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
      userId: req.user!.id,
      isPublic: !!req.body.isPublic
    })

    if (mode === 'choir' && partialsCount > 0) {
      t.partialsCount = partialsCount
    }

    if (ttsLangs) {
      t.ttsLangs = Array.from(ttsLangs)
    }

    t.save((err) => {
      if (err) {
        console.log('Failed uploading track with:', err)
        res.status(500).send(err)
      } else {
        res.status(201).send(t)
      }
    })
  } catch (err) {
    console.log('Failed uploading track with:', err)
    res.status(500).send(err)
  }
}

exports.editTrack = async (req: Request, res: Response) => {
  const patch = req.body

  const { path, partialFileToSave } = handleUploadedPartialFile(<File[]>req.files)
  if (Object.keys(partialFileToSave).length) {
    patch.partialFile = partialFileToSave
  }

  const { ttsFilesToSave, ttsLangs, ttsJson } = handleUploadedTtsFiles(<File[]>req.files)
  if (ttsFilesToSave.length && ttsLangs) {
    patch.ttsFiles = ttsFilesToSave
    patch.ttsLangs = Array.from(ttsLangs)
  }

  const { partialsCount, chunks } = await chunk(path, ttsJson)

  if (Object.keys(chunks)) {
    const filename = uuid.v4()
    fs.writeFile(`chunks/${filename}`, JSON.stringify(chunks), (err: any) => {
      if (err) {
        console.error(err)
      }
    })
  }

  if (partialsCount > 0 && patch.mode === 'choir') {
    patch.partialsCount = partialsCount
  } else {
    patch.partialsCount = undefined
  }

  patch.chunks = JSON.stringify(chunks)

  Track.findByIdAndUpdate(req.params.id, patch, { new: true }, (err, track) => {
    if (err) {
      res.status(500).json({ error: err.message })
    } else {
      res.json(track)
    }
  })
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

exports.get_voices_and_languages = async (req: Request, res: Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*') // cors error without this
  try {
    let maxPartialsCount = -1
    let ttsLangs: string[] = []

    const tracks = await Track.find({}, 'partialsCount ttsLangs mode')
    for (const track of tracks) {
      if (track.mode === 'choir' && track.partialsCount && track.partialsCount > maxPartialsCount) {
        maxPartialsCount = track.partialsCount
      }

      if (track.ttsLangs.length) {
        for (const lang of track.ttsLangs) {
          if (!ttsLangs.includes(lang)) {
            ttsLangs.push(lang)
          }
        }
      }
    }

    res.json({ maxPartialsCount, ttsLangs })
  } catch (err) {
    console.log('Failed getting voices and languages with:', err)
    res.status(500).json({ Error: 'Failed fetching voices and languages.' })
  }
}

exports.get_own_tracks = (req: Request, res: Response) => {
  res.json({ message: 'hi', user: req.user })
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
