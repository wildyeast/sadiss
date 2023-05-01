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
router.post('/track/create', authenticateToken, upload.array('files'), track_controller.upload_track)

// Edit track
router.patch('/track/edit/:id', upload.array('files'), track_controller.edit_track)

// Get tracks
router.get('/tracks', authenticateToken, track_controller.get_tracks)

// Get track
router.get('/track/:id', track_controller.get_track)

// Delete track
router.post('/track/delete/:id', track_controller.delete_track)

// Start track
router.post('/track/start/:id/:startTime', track_controller.start_track)

// Stop track
router.get('/track/stop', track_controller.stop_track)

// Get voices and languages
router.get('/get-voices-and-languages', track_controller.get_voices_and_languages)

// Get performances
router.get('/performances', performance_controller.get_performances)

// Get stats
router.get('/stats', track_controller.get_stats)

/* AUTH */

// Login
router.post('/login', passport.authenticate('local', { session: false }), auth_controller.login)

// Register
router.post('/register', auth_controller.register)

// Protected Test Route
router.get('/get-own-tracks', authenticateToken, track_controller.get_own_tracks)

/* Performance */
// Create performance
router.post('/performance/create', authenticateToken, performance_controller.create_performance)

/* TrackPerformance */
router.post(
  '/performance/:id/add-track',
  [authenticateToken, validateTrackAccess, validatePerformanceAccess],
  track_performance_controller.add_track_to_performance
)

module.exports = router
