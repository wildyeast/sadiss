import express from 'express'

const track_controller = require('../controllers/trackController')

const performance_controller = require('../controllers/performanceController')

const router = express.Router()

const multer = require('multer')
const upload = multer({ dest: 'uploads/' })

// Upload track
router.post('/upload', upload.array('files'), track_controller.upload_track)

// Edit track
router.patch('/edit/:id', upload.array('files'), track_controller.edit_track)

// Get tracks
router.get('/get-tracks', track_controller.get_tracks)

// Get track
router.get('/get-track/:id', track_controller.get_track)

// Delete track
router.post('/delete-track/:id', track_controller.delete_track)

// Start track
router.post('/start-track/:id/:startTime', track_controller.start_track)

// Stop track
router.get('/stop-track', track_controller.stop_track)

// Stop track
router.get('/get-voices-and-languages', track_controller.get_voices_and_languages)

// Get performances
router.get('/get-performances', performance_controller.get_performances)

module.exports = router
