import { connectDB, disconnectDB } from '../database'
import { TrackPerformance } from '../models/trackPerformance'
import { authenticatedRequest } from './testUtils'

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
      const trackPerformanceData = { trackId: '000000000000', performanceId: '111111111111' }
      const res = await authenticatedRequest(request, '/api/add-track-to-performance', 'post').send(trackPerformanceData)

      expect(res.status).toBe(201)

      const savedTrackPerformance = await TrackPerformance.findOne({ trackId: '000000000000', performanceId: '111111111111' })
      expect(savedTrackPerformance).toBeDefined()
    })

    it('should return a 500 error if there is an error while creating a TrackPerformance record', async () => {
      jest.spyOn(TrackPerformance.prototype, 'save').mockImplementationOnce(() => {
        throw new Error('Server error')
      })

      const trackPerformanceData = { trackId: '000000000000', performanceId: '111111111111' }
      const res = await authenticatedRequest(request, '/api/add-track-to-performance', 'post').send(trackPerformanceData)

      expect(res.status).toBe(500)
    })
  })
})

export {}
