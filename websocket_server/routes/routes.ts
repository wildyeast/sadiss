import express from 'express'
import { Mode } from 'fs'
import { chunk, startSendingInterval } from '../tools'
import { PartialChunk, TtsInstruction } from '../types/types'

const track_controller = require('../controllers/trackController')

const router = express.Router()
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })

// Upload track
router.post('/upload', upload.array('pfile'), track_controller.upload_track)

// Get tracks
router.get('/get-tracks', track_controller.get_tracks)

// Start track
router.post('/start-track/:id/:startTime', track_controller.start_track)

// Delete track
router.post('/delete-track/:id', track_controller.delete_track)

module.exports = router
