import express from 'express'
import { chunk, startSendingInterval } from "../tools"
import { convertSrtToJson } from '../tools/convertSrtToJson'

const mongoose = require('mongoose')

// Define track schema for db
const trackSchema = new mongoose.Schema({
  name: String,
  chunks: String,
  mode: String,
  notes: String,
  ttsInstrunctions: String
})
trackSchema.set('timestamps', true)

// Start track
exports.start_track = async (req: express.Request, res: express.Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*') // cors error without this
  const Track = mongoose.model('Track', trackSchema)
  const t = await Track.findById(req.params.id)
  const track = t.chunks ? JSON.parse(t.chunks) : null
  const startTime = +req.params.startTime
  startSendingInterval(track, t.mode, startTime, req.wss)
  res.send(JSON.stringify({ data: 'Track started.' }))
}

exports.delete_track = async (req: express.Request, res: express.Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*') // cors error without this
  const Track = mongoose.model('Track', trackSchema)
  await Track.deleteOne({ _id: req.params.id })
  res.send()
}

exports.get_tracks = async (req: express.Request, res: express.Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*') // cors error without this
  const Track = mongoose.model('Track', trackSchema)
  try {
    const allTracks = await Track.find({}, '_id name notes mode')
    res.json(JSON.stringify({ tracks: allTracks }))
  }
  catch (err) {
    console.log('Failed getting tracks with:', err)
    res.status(500).json(JSON.stringify({ Error: 'Failed fetching tracks.' }))
  }
}

exports.upload_track = async (req: express.Request, res: express.Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*') // cors error without this

  if (!req.files) return

  try {
    const partialFile = Object.values(req.files).filter((file: Express.Multer.File) => file.originalname === 'partialfile')[0]
    let path
    if (partialFile) {
      path = partialFile.path
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
    // Save track to DB
    const Track = mongoose.model('Track', trackSchema)
    const t = new Track({
      name,
      chunks: JSON.stringify(chunks),
      notes,
      mode
    })
    t.save(function (err: Error) {
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