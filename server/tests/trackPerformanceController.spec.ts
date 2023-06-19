import { SadissPerformance, Track } from '../models'
import { TrackPerformance } from '../models/trackPerformance'
import { createTestPerformance, createTestTrack, generateMockId, testPerformanceId, testTrackId } from './testUtils'

jest.mock('../middlewares/validateTrackAccess', () => ({
  validateTrackAccess: jest.fn((req, res, next) => next())
}))

jest.mock('../middlewares/validatePerformanceAccess', () => ({
  validatePerformanceAccess: jest.fn((req, res, next) => next())
}))

describe('trackPerformanceController test', () => {
  describe('addTrackToPerformance function', () => {
    it('should return a 201 status and the saved TrackPerformance data on success', async () => {
      // const mockTrackId = generateMockId()
      // const mockPerformanceId = generateMockId()

      await createTestTrack()
      await createTestPerformance()

      const trackPerformanceData = { trackId: testTrackId, performanceId: testPerformanceId }
      const res = await authenticatedRequest('/api/add-track-to-performance', 'post')!.send(trackPerformanceData).expect(201)

      const savedTrackPerformance = await TrackPerformance.findOne({ trackId: testTrackId, performanceId: testPerformanceId })
      expect(savedTrackPerformance).toBeDefined()
    })

    it('should return a 400 error if no performanceId is provided', async () => {
      await createTestTrack()
      const trackPerformanceData = { trackId: testTrackId }
      const res = await authenticatedRequest('/api/add-track-to-performance', 'post')!.send(trackPerformanceData)
      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Invalid input data')
    })

    it('should return a 400 error if no trackId is provided', async () => {
      await createTestPerformance()
      const trackPerformanceData = { performanceId: testPerformanceId }
      const res = await authenticatedRequest('/api/add-track-to-performance', 'post')!.send(trackPerformanceData)
      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Invalid input data')
    })

    it('should return a 400 error if a non-public track is added to a public performance', async () => {
      const performance = await SadissPerformance.create({ name: 'Test performance', isPublic: true, userId: global.mockUser.id })
      const track = await Track.create({
        name: 'Test track',
        isPublic: false,
        userId: global.mockUser.id,
        mode: 'choir',
        waveform: 'sine'
      })
      const trackPerformanceData = { trackId: track._id, performanceId: performance._id }
      const res = await authenticatedRequest('/api/add-track-to-performance', 'post')!.send(trackPerformanceData)
      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Cannot add private track to public performance')
    })

    it('should return a 500 error if there is an error while creating a TrackPerformance record', async () => {
      jest.spyOn(TrackPerformance.prototype, 'save').mockImplementationOnce(() => {
        throw new Error('Server error')
      })

      await createTestTrack()
      await createTestPerformance()

      const trackPerformanceData = { trackId: testTrackId, performanceId: testPerformanceId }
      const res = await authenticatedRequest('/api/add-track-to-performance', 'post')!.send(trackPerformanceData)

      expect(res.status).toBe(500)
    })
  })
})

export {}
