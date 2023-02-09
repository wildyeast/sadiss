import express from 'express'
import { chunk, startSendingInterval } from "../tools"
import { convertSrtToJson } from '../tools/convertSrtToJson'
import mongoose from 'mongoose'

// Define track schema for db
const trackSchema = new mongoose.Schema({
  name: String,
  chunks: String,
  mode: String,
  notes: String,
  ttsInstrunctions: String,
  waveform: String,
  ttsRate: String,
  partialFile: Object,
  ttsFiles: Array
})
trackSchema.set('timestamps', true)
const Track = mongoose.model('Track', trackSchema)

// Start track
exports.start_track = async (req: express.Request, res: express.Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*') // cors error without this
  try {
    const t = await Track.findById(req.params.id)
    if (t) {
      const track = t.chunks ? JSON.parse(t.chunks) : null
      const startTime = +req.params.startTime
      // @ts-expect-error TODO
      startSendingInterval(track, t.mode, t.waveform, t.ttsRate, startTime, req.wss)
      res.json({ data: 'Track started.' })
    } else {
      throw new Error('Track not found.')
    }
  } catch (err) {
    res.status(500).json({ error: err })
  }
}

exports.delete_track = async (req: express.Request, res: express.Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*') // cors error without this
  await Track.deleteOne({ _id: req.params.id })
  res.send()
}

exports.get_tracks = async (req: express.Request, res: express.Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*') // cors error without this
  try {
    const allTracks = await Track.find({}, '_id name notes mode waveform ttsRate')
    res.json({ tracks: allTracks })
  }
  catch (err) {
    console.log('Failed getting tracks with:', err)
    res.status(500).json({ Error: 'Failed fetching tracks.' })
  }
}


exports.get_track = async (req: express.Request, res: express.Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*') // cors error without this
  try {
    const track = await Track.find({ _id: req.params.id }, '_id name notes mode waveform ttsRate partialFile ttsFiles')
    res.json(track)
  }
  catch (err) {
    console.log('Failed getting track with:', err)
    res.status(500).json({ Error: 'Failed fetching track.' })
  }
}

exports.upload_track = async (req: express.Request, res: express.Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*') // cors error without this

  if (!req.files) return

  try {
    const partialFile = Object.values(req.files).filter((file: Express.Multer.File) => file.originalname === 'partialfile')[0]
    let path
    const partialFileToSave = <{ origName: string, fileName: string }>{}
    if (partialFile) {
      path = partialFile.path
      partialFileToSave.origName = partialFile.originalname
      partialFileToSave.fileName = partialFile.filename
    }

    const ttsFiles = Object.values(req.files).filter((file: Express.Multer.File) => file.originalname.includes('ttsfile'))
    let ttsJson
    if (ttsFiles.length) {
      ttsJson = convertSrtToJson(ttsFiles)
    }

    const chunks = await chunk(path, ttsJson)

    const name = req.body.name
    const notes = req.body.notes
    const mode = req.body.mode
    const waveform = req.body.waveform
    const ttsRate = req.body.ttsRate
    // Save track to DB
    const t = new Track({
      name,
      chunks: JSON.stringify(chunks),
      notes,
      mode,
      waveform,
      ttsRate,
      partialFile: partialFileToSave,
      ttsFiles: ttsFiles.map((file: Express.Multer.File) => ({ origName: file.originalname, fileName: file.filename }))
    })

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

exports.edit_track = async (req: express.Request, res: express.Response) => {
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
    let ttsJson
    if (ttsFiles.length) {
      ttsJson = convertSrtToJson(ttsFiles)
      patch.ttsFiles = Object.values(req.files).map((file: Express.Multer.File) => ({ origName: file.originalname, fileName: file.filename }))
    }

    const chunks = await chunk(path, ttsJson)
    patch.chunks = JSON.stringify(chunks)
  }

  Track.findByIdAndUpdate(req.params.id, patch, { new: true }, ((err, track) => {
    if (err) {
      res.status(500).json({ error: err.message })
    } else {
      res.json(track)
    }
  }))
}
