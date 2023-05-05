import { Request, Response } from 'express'
import { chunk } from '../tools'
import { convertSrtToJson } from '../tools/convertSrtToJson'
import mongoose from 'mongoose'
import { TtsJson } from '../types/types'
import { Server } from 'ws'
import { ActivePerformance } from '../activePerformance'
const fs = require('fs')
const uuid = require('uuid')

// Define track schema for db
const trackSchema = new mongoose.Schema({
  name: String,
  chunks: String,
  chunkFileName: String,
  partialsCount: Number,
  mode: String,
  notes: String,
  ttsInstructions: String,
  ttsLangs: Array,
  waveform: String,
  ttsRate: String,
  partialFile: Object,
  ttsFiles: Array
})
trackSchema.set('timestamps', true)
const Track = mongoose.model('Track', trackSchema)

let wss: Server

const activePerformances: ActivePerformance[] = []

// Start track
exports.start_track = async (req: Request, res: Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*') // cors error without this
  wss = req.wss
  try {
    const t = await Track.findById(req.params.trackId)
    if (t) {
      let chunks
      fs.readFile(`chunks/${t.chunkFileName}`, 'utf8', (err: any, data: string) => {
        if (err) {
          console.error(err)
          return
        }
        chunks = JSON.parse(data)
        const startTime = +req.params.startTime
        if (!chunks) {
          throw new Error('Chunks undefined')
        }

        const performanceId = req.params.performanceId

        // Check if performance already exists
        let performance = activePerformances.find((p) => p.id === performanceId)
        if (!performance) {
          performance = new ActivePerformance(performanceId)
          activePerformances.push(performance)
        }

        const loopTrack = req.params.loopTrack === 'true'
        const trackStarted = performance.startSendingInterval(
          chunks,
          // @ts-ignore TODO
          t.mode,
          t.waveform,
          t.ttsRate,
          startTime,
          req.wss,
          loopTrack
        )
        if (trackStarted) {
          res.json({ data: 'Track started.' })
        } else {
          res.json({ data: 'Track already running.' })
        }
      })
    } else {
      throw new Error('Track not found.')
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

exports.delete_track = async (req: Request, res: Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*') // cors error without this
  await Track.deleteOne({ _id: req.params.id })
  res.send()
}

exports.get_tracks = async (req: Request, res: Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*') // cors error without this
  try {
    const allTracks = await Track.find({}, '_id name notes mode waveform ttsRate')
    res.json({ tracks: allTracks })
  } catch (err) {
    console.log('Failed getting tracks with:', err)
    res.status(500).json({ Error: 'Failed fetching tracks.' })
  }
}

exports.get_track = async (req: Request, res: Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*') // cors error without this
  try {
    const track = await Track.find({ _id: req.params.id }, '_id name notes mode waveform ttsRate partialFile ttsFiles')
    res.json(track)
  } catch (err) {
    console.log('Failed getting track with:', err)
    res.status(500).json({ Error: 'Failed fetching track.' })
  }
}

exports.upload_track = async (req: Request, res: Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*') // cors error without this

  if (!req.files) return

  try {
    const partialFile = Object.values(req.files).filter((file: Express.Multer.File) => file.originalname === 'partialfile')[0]
    let path
    const partialFileToSave = <{ origName: string; fileName: string }>{}

    if (partialFile) {
      path = partialFile.path
      partialFileToSave.origName = partialFile.originalname
      partialFileToSave.fileName = partialFile.filename
    }

    // @ts-ignore
    const ttsFiles = Object.values(req.files).filter((file: Express.Multer.File) => file.originalname.includes('ttsfile'))
    let ttsLangs: Set<string> | undefined
    let ttsJson: TtsJson | undefined
    if (ttsFiles.length) {
      ;({ ttsLangs, ttsJson } = convertSrtToJson(ttsFiles))
    }

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
      ttsFiles: ttsFiles.map((file: Express.Multer.File) => ({ origName: file.originalname, fileName: file.filename }))
    })

    if (mode === 'choir' && partialsCount > 0) {
      t.partialsCount = partialsCount
    }

    if (ttsLangs) {
      t.ttsLangs = Array.from(ttsLangs)
    }

    t.save(function (err) {
      if (err) {
        console.error('Error while uploading track', err)
        return
      }
    })
    res.status(200).send(JSON.stringify(t))
  } catch (e) {
    console.log('ERR')
    console.log(e)
    res.status(500).send()
  }
}

exports.edit_track = async (req: Request, res: Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*') // cors error without this

  const patch = req.body

  if (req.files) {
    const partialFile = Object.values(req.files).filter((file: Express.Multer.File) => file.originalname === 'partialfile')[0]
    let path
    if (partialFile) {
      path = partialFile.path
      patch.partialFile = {
        origName: partialFile.originalname,
        fileName: partialFile.filename
      }
    }

    const ttsFiles = Object.values(req.files).filter((file: Express.Multer.File) => file.originalname.includes('ttsfile'))
    let ttsLangs: Set<string> | undefined
    let ttsJson: TtsJson | undefined
    if (ttsFiles.length) {
      ;({ ttsLangs, ttsJson } = convertSrtToJson(ttsFiles))
      patch.ttsFiles = Object.values(req.files).map((file: Express.Multer.File) => ({
        origName: file.originalname,
        fileName: file.filename
      }))
      patch.ttsLangs = Array.from(ttsLangs)
    }

    const { partialsCount, chunks } = await chunk(path, ttsJson)

    if (partialsCount > 0) {
      patch.partialsCount = partialsCount
    }

    patch.chunks = JSON.stringify(chunks)
  }

  Track.findByIdAndUpdate(req.params.id, patch, { new: true }, (err, track) => {
    if (err) {
      res.status(500).json({ error: err.message })
    } else {
      res.json(track)
    }
  })
}

exports.stop_track = (req: Request, res: Response) => {
  const performance = activePerformances.find((p) => p.id === req.params.performanceId)
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
