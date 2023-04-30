import express from 'express'
import passport from 'passport'
import { authenticateToken } from '../auth'
import { validatePerformanceAccess } from '../middlewares/validatePerformanceAccess'
import { validateTrackAccess } from '../middlewares/validateTrackAccess'

const track_controller = require('../controllers/trackController')
const performance_controller = require('../controllers/performanceController')
const track_performance_controller = require('../controllers/trackPerformanceController')

const auth_controller = require('../controllers/authController')

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

// Get stats
router.get('/get-stats', track_controller.get_stats)

/* AUTH */

// Login
router.post('/login', passport.authenticate('local', { session: false }), auth_controller.login)

// Register
router.post('/register', auth_controller.register)

// Protected Test Route
router.get('/protected', authenticateToken, track_controller.get_own_tracks)

/* Performance */
// Create performance
router.post('/create-performance', authenticateToken, performance_controller.create_performance)

/* TrackPerformance */
router.post(
  '/add-track-to-performance',
  [authenticateToken, validateTrackAccess, validatePerformanceAccess],
  track_performance_controller.add_track_to_performance
)

module.exports = router
