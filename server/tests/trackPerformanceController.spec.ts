import { connectDB, disconnectDB } from '../database'
import { SadissPerformance, Track } from '../models'
import { TrackPerformance } from '../models/trackPerformance'
import { authenticatedRequest, generateMockId } from './testUtils'

const { app, server, wss } = require('../server')
const supertest = require('supertest')

jest.mock('../middlewares/validateTrackAccess', () => ({
  validateTrackAccess: jest.fn((req, res, next) => next())
}))

jest.mock('../middlewares/validatePerformanceAccess', () => ({
  validatePerformanceAccess: jest.fn((req, res, next) => next())
}))

const request = supertest(app)

describe('trackPerformanceController test', () => {
  beforeAll(async () => {
    await connectDB()
  })

  afterAll(async () => {
    await disconnectDB()
    server.close()
    wss.close()
  })

  describe('addTrackToPerformance function', () => {
    it('should return a 201 status and the saved TrackPerformance data on success', async () => {
      const mockTrackId = generateMockId()
      const mockPerformanceId = generateMockId()

      const trackPerformanceData = { trackId: mockTrackId, performanceId: mockPerformanceId }
      const res = await authenticatedRequest(request, '/api/add-track-to-performance', 'post').send(trackPerformanceData)

      expect(res.status).toBe(201)

      const savedTrackPerformance = await TrackPerformance.findOne({ trackId: mockTrackId, performanceId: mockPerformanceId })
      expect(savedTrackPerformance).toBeDefined()
    })

    it('should return a 400 error if no trackId is provided', async () => {
      const trackPerformanceData = { trackId: generateMockId() }
      const res = await authenticatedRequest(request, '/api/add-track-to-performance', 'post').send(trackPerformanceData)
      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Invalid input data')
    })

    it('should return a 400 error if no performanceId is provided', async () => {
      const trackPerformanceData = { performanceId: generateMockId() }
      const res = await authenticatedRequest(request, '/api/add-track-to-performance', 'post').send(trackPerformanceData)
      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Invalid input data')
    })

    it('should return a 400 error if a non-public track is added to a public performance', async () => {
      const performance = await SadissPerformance.create({ name: 'Test performance', isPublic: true, userId: generateMockId() })
      const track = await Track.create({
        name: 'Test track',
        isPublic: false,
        userId: generateMockId(),
        mode: 'choir',
        waveform: 'sine'
      })
      const trackPerformanceData = { trackId: track._id, performanceId: performance._id }
      const res = await authenticatedRequest(request, '/api/add-track-to-performance', 'post').send(trackPerformanceData)
      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Cannot add private track to public performance')
    })

    it('should return a 500 error if there is an error while creating a TrackPerformance record', async () => {
      jest.spyOn(TrackPerformance.prototype, 'save').mockImplementationOnce(() => {
        throw new Error('Server error')
      })

      const trackPerformanceData = { trackId: generateMockId(), performanceId: generateMockId() }
      const res = await authenticatedRequest(request, '/api/add-track-to-performance', 'post').send(trackPerformanceData)

      expect(res.status).toBe(500)
    })
  })
})

export {}
