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

router.use('/api', authenticateToken)

// Upload track
router.post('/api/track/create', upload.array('files'), track_controller.upload_track)

// Edit track
router.patch('/api/track/edit/:id', upload.array('files'), track_controller.edit_track)

// Get tracks
router.get('/api/tracks', track_controller.getTracks)

// Get track
router.get('/api/track/:id', track_controller.get_track)

// Delete track
router.post('/api/track/delete/:id', track_controller.delete_track)

// Start track
router.post('/api/track/start/:trackId/:performanceId/:startTime/:loopTrack', track_controller.start_track)

// Stop track
router.get('/api/track/stop/:performanceId', track_controller.stop_track)

// Get voices and languages
router.get('/api/get-voices-and-languages', track_controller.get_voices_and_languages)

// Get stats
router.get('/api/stats', track_controller.get_stats)

// Protected Test Route
router.get('/api/get-own-tracks', track_controller.get_own_tracks)

/* PERFORMANCE */
// Get performances
router.get('/api/performances', performance_controller.getPerformances)

// Get performance
router.get('/api/performance/:id', performance_controller.getPerformance)

// Create performance
router.post('/api/performance/create', performance_controller.create_performance)

// Delete performance
router.delete('/api/performance/delete/:id', performance_controller.delete_performance)

/* TRACK PERFORMANCE */
// Add track to performance
router.post(
  '/api/performance/:id/add-track',
  [validateTrackAccess, validatePerformanceAccess],
  track_performance_controller.add_track_to_performance
)

/* AUTH */
// Login
router.post('/login', passport.authenticate('local', { session: false }), auth_controller.login)

// Register
router.post('/register', auth_controller.register)

module.exports = router
