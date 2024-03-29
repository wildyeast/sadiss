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
      expect(savedTrackPerformance!.sortOrder).toBe(1)
    })

    it('should set the sortOrder of the TrackPerformance to the number of TrackPerformances in the performance + 1', async () => {
      const trackId = await createTestTrack()
      const performanceId = await createTestPerformance()

      const trackPerformanceData = { trackId, performanceId }
      const res = await agent.post('/api/add-track-to-performance').send(trackPerformanceData).expect(201)

      const savedTrackPerformance = await TrackPerformance.findOne({ track: trackId, performance: performanceId })
      expect(savedTrackPerformance).toBeDefined()
      expect(savedTrackPerformance!.sortOrder).toBe(1)

      const trackId2 = await createTestTrack()
      const trackPerformanceData2 = { trackId: trackId2, performanceId }
      const res2 = await agent.post('/api/add-track-to-performance').send(trackPerformanceData2).expect(201)

      const savedTrackPerformance2 = await TrackPerformance.findOne({ track: trackId2, performance: performanceId })
      expect(savedTrackPerformance2).toBeDefined()
      expect(savedTrackPerformance2!.sortOrder).toBe(2)
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
      await agent.post('/api/add-track-to-performance').send(trackPerformanceData).expect(500)
    })
  })

  describe('POST /api/track-performance/update-order', () => {
    it('Should update the order of all TrackPerformances of the performance and return 200', async () => {
      const performanceId = await createTestPerformance()
      const trackId = await createTestTrack()
      const trackId2 = await createTestTrack()

      await agent.post('/api/add-track-to-performance').send({ trackId, performanceId }).expect(201)
      await agent.post('/api/add-track-to-performance').send({ trackId: trackId2, performanceId }).expect(201)

      const res = await agent.get(`/api/performance/${performanceId}/with-tracks`).expect(200)

      const reSortRequestObject = {
        trackPerformances: [
          { trackPerformanceId: res.body.performance.tracks[0].trackPerformanceId, sortOrder: 2 },
          { trackPerformanceId: res.body.performance.tracks[1].trackPerformanceId, sortOrder: 1 }
        ]
      }

      await agent.post('/api/track-performance/update-order').send(reSortRequestObject).expect(200)

      const trackPerformance1 = await TrackPerformance.find({ _id: res.body.performance.tracks[0].trackPerformanceId })
      const trackPerformance2 = await TrackPerformance.find({ _id: res.body.performance.tracks[1].trackPerformanceId })

      expect(trackPerformance1[0].sortOrder).toBe(2)
      expect(trackPerformance2[0].sortOrder).toBe(1)
    })

    it('Should return 400 if the request body contains invalid data', async () => {
      const performanceId = await createTestPerformance()
      const trackId = await createTestTrack()
      const trackId2 = await createTestTrack()

      await agent.post('/api/add-track-to-performance').send({ trackId, performanceId }).expect(201)
      await agent.post('/api/add-track-to-performance').send({ trackId: trackId2, performanceId }).expect(201)

      const res = await agent.get(`/api/performance/${performanceId}/with-tracks`).expect(200)

      const reSortRequestObject = {
        trackPerformances: [
          { trackPerformanceId: res.body.performance.tracks[0].trackPerformanceId, sortOrder: 2 },
          { trackPerformanceId: res.body.performance.tracks[1].trackPerformanceId }
        ]
      }

      await agent.post('/api/track-performance/update-order').send(reSortRequestObject).expect(400)
    })
  })
})

export {}
