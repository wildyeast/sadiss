import { SadissPerformance, Track } from '../models'
import { TrackPerformance } from '../models/trackPerformance'
import { createTestPerformance, createTestTrack } from './testUtils'

jest.mock('../middlewares/validateTrackAccess', () => ({
  validateTrackAccess: jest.fn((req, res, next) => next())
}))

jest.mock('../middlewares/validatePerformanceAccess', () => ({
  validatePerformanceAccess: jest.fn((req, res, next) => next())
}))

describe('trackPerformanceController test', () => {
  describe('addTrackToPerformance function', () => {
    it('should return a 201 status and the saved TrackPerformance data on success', async () => {
      const trackId = await createTestTrack()
      const performanceId = await createTestPerformance()

      const trackPerformanceData = { trackId, performanceId }
      const res = await agent.post('/api/add-track-to-performance').send(trackPerformanceData).expect(201)

      const savedTrackPerformance = await TrackPerformance.findOne({ track: trackId, performance: performanceId })
      expect(savedTrackPerformance).toBeDefined()
    })

    it('should return a 400 error if no performanceId is provided', async () => {
      const trackId = await createTestTrack()
      const trackPerformanceData = { track: trackId }
      const res = await agent.post('/api/add-track-to-performance').send(trackPerformanceData)
      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Invalid input data')
    })

    it('should return a 400 error if no trackId is provided', async () => {
      const performanceId = await createTestPerformance()
      const trackPerformanceData = { performance: performanceId }
      const res = await agent.post('/api/add-track-to-performance').send(trackPerformanceData)
      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Invalid input data')
    })

    it('should return a 400 error if a non-public track is added to a public performance', async () => {
      const performance = await SadissPerformance.create({
        name: 'Test performance',
        isPublic: true,
        creator: global.mockUser.id
      })
      const track = await Track.create({
        name: 'Test track',
        isPublic: false,
        creator: global.mockUser.id,
        mode: 'choir',
        waveform: 'sine'
      })
      const trackPerformanceData = { trackId: track._id, performanceId: performance._id }
      const res = await agent.post('/api/add-track-to-performance').send(trackPerformanceData)
      expect(res.status).toBe(400)
      expect(res.body.message).toBeTruthy()
    })

    it('should return a 500 error if there is an error while creating a TrackPerformance record', async () => {
      jest.spyOn(TrackPerformance.prototype, 'save').mockImplementationOnce(() => {
        throw new Error('Server error')
      })

      const trackId = await createTestTrack()
      const performanceId = await createTestPerformance()

      const trackPerformanceData = { trackId, performanceId }
      const res = await agent.post('/api/add-track-to-performance').send(trackPerformanceData).expect(500)
    })
  })

  // describe('POST /api/track-performance/update-order', () => {
  //   it('Should update the order of all TrackPerformances of the performance and return 200', async () => {
  //     const trackId = await createTestTrack()
  //     const performanceId = await createTestPerformance()

  //     const trackPerformanceData = { trackId, performanceId }
  //     const res = await agent.post('/api/add-track-to-performance').send(trackPerformanceData).expect(201)
  //   })
  // })
})

export {}
