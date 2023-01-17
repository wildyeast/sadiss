import express from 'express'
import { Mode } from 'node:fs'
import { chunk, startSendingInterval } from "../tools"
import { PartialChunk, TtsInstruction } from "../types/types"

const mongoose = require('mongoose')
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })

// Define track schema for db
const trackSchema = new mongoose.Schema({
  name: String,
  chunks: String,
  mode: String,
  notes: String
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
    const file = req.files[0]
    const path = file.path
    const name = req.body.name
    const chunks = await chunk(path)
    const notes = req.body.notes
    const mode = req.body.mode
    // Save track to DB
    const Track = mongoose.model('Track', trackSchema)
    const t = new Track({ name, chunks: JSON.stringify(chunks), notes, mode })
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
