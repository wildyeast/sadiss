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
  const track = JSON.parse(t.chunks)
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

  try {
    // @ts-expect-error
    const partialFile = req.files.filter(file => file.originalname === 'partialfile')[0]
    let chunks
    if (partialFile) {
      const path = partialFile.path
      chunks = await chunk(path)
    }

    // @ts-expect-error
    const ttsFiles = req.files.filter(file => file.originalname.includes('ttsfile'))
    const ttsJson = convertSrtToJson(ttsFiles)

    const name = req.body.name
    const notes = req.body.notes
    const mode = req.body.mode
    // Save track to DB
    const Track = mongoose.model('Track', trackSchema)
    const t = new Track({
      name,
      chunks: JSON.stringify(chunks),
      ttsInstructions: JSON.stringify(ttsJson),
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
