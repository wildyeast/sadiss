import express from 'express'
import passport from 'passport'
import { authenticateToken } from '../auth'
import { validatePerformanceAccess } from '../middlewares/validatePerformanceAccess'
import { validateTrackAccess } from '../middlewares/validateTrackAccess'

const track_controller = require('../controllers/trackController')
const performance_controller = require('../controllers/performanceController')
const track_performance_controller = require('../controllers/trackPerformanceController')
const performance_view_controller = require('../controllers/performanceViewController')

const auth_controller = require('../controllers/authController')

const router = express.Router()

import multer from 'multer'

const upload = multer({ dest: 'uploads/' });

router.use('/api', authenticateToken)

// Upload track
router.post('/api/track/create', upload.array('files'), track_controller.uploadTrack)

// Edit track
router.post('/api/track/edit/:id', upload.array('files'), track_controller.editTrack)

// Get tracks
router.get('/api/tracks', track_controller.getTracks)

// Get track
router.get('/api/track/:id', track_controller.getTrack)

// Delete track
router.post('/api/track/delete/:id', track_controller.deleteTrack)

// Start track
router.post('/api/track/start', track_controller.startTrack)

// Stop track
router.post('/api/track/stop', track_controller.stopTrack)

// Load track for playback
router.post('/api/track/load', track_controller.loadTrackForPlayback)

// Get voices and languages
router.get('/api/get-voices-and-languages', track_controller.get_voices_and_languages)

// Protected Test Route
router.get('/api/get-own-tracks', track_controller.get_own_tracks)

/* PERFORMANCE */
// Get performances
router.get('/api/performances', performance_controller.getPerformances)

// Get own performances
router.get('/api/own-performances', performance_controller.getOwnPerformances)

// Get performance
router.get('/api/performance/:id', performance_controller.getPerformance)

// Create performance
router.post('/api/performance/create', performance_controller.createPerformance)

// Delete performance
router.post('/api/performance/delete/:id', performance_controller.deletePerformance)

// Edit performance
router.post('/api/performance/edit/:id', performance_controller.editPerformance)

// Get clients per choir id
router.get('/api/client-count-per-choir-id/:performanceId', performance_controller.getClientCountPerChoirId)

/* TRACK PERFORMANCE */
// Add track to performance
router.post(
  '/api/add-track-to-performance',
  [validateTrackAccess, validatePerformanceAccess],
  track_performance_controller.addTrackToPerformance
)

/* PERFORMANCE VIEW */
// Get performance with tracks
router.get('/api/performance/:id/with-tracks', performance_view_controller.getPerformanceWithTracks)

/* AUTH */
// Login
router.post('/login', passport.authenticate('local', { session: false }), auth_controller.login)

// Register
router.post('/register', auth_controller.register)

// Is logged in
router.get('/is-logged-in', auth_controller.isLoggedIn)

// Logout
router.get('/logout', auth_controller.logout)

module.exports = router
