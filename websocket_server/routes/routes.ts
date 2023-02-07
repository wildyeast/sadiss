import express from 'express'

const track_controller = require('../controllers/trackController')

const router = express.Router()

// Upload track
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })
router.post('/upload', upload.array('files'), track_controller.upload_track)

// Get tracks
router.get('/get-tracks', track_controller.get_tracks)

// Get track
router.get('/get-track/:id', track_controller.get_track)

// Start track
router.post('/start-track/:id/:startTime', track_controller.start_track)

// Delete track
router.post('/delete-track/:id', track_controller.delete_track)

module.exports = router
