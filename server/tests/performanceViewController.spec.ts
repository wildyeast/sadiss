import { connectDB, disconnectDB } from '../database'
import { SadissPerformance, User, TrackPerformance, Track } from '../models'
import { authenticatedRequest, generateMockId } from './testUtils'

const { app, server, wss } = require('../server')
const supertest = require('supertest')
const request = supertest(app)

describe('getPerformanceWithTracks', () => {
  beforeAll(async () => {
    await connectDB()
  })

  afterAll(async () => {
    await disconnectDB()
    server.close()
    wss.close()
  })

  it('should return performance data with associated tracks', async () => {
    const testUser = new User({
      username: 'test-username',
      password: 'test-password',
      email: 'test@email.com'
    })
    await testUser.save()

    const testPerformance = new SadissPerformance({
      name: 'Performance 1',
      userId: testUser._id,
      isPublic: true
    })
    await testPerformance.save()

    const testTrack1 = new Track({
      name: 'Track 1',
      mode: 'choir',
      waveform: 'sine',
      ttsRate: 1.5,
      userId: testUser._id,
      isPublic: true
    })
    await testTrack1.save()

    const trackPerformance = new TrackPerformance({
      trackId: testTrack1._id,
      performanceId: testPerformance._id
    })
    await trackPerformance.save()

    const testTrack2 = new Track({
      name: 'Track 2',
      mode: 'choir',
      waveform: 'sine',
      ttsRate: '1',
      userId: testUser._id,
      isPublic: false,
      notes: 'test-notes'
    })
    await testTrack2.save()

    const trackPerformance2 = new TrackPerformance({
      trackId: testTrack2._id,
      performanceId: testPerformance._id
    })
    await trackPerformance2.save()

    const res = await authenticatedRequest(request, `/api/performance/${testPerformance._id}/with-tracks`, 'get').expect(200)
    expect(res.body).toEqual({
      _id: testPerformance._id.toString(),
      name: 'Performance 1',
      username: 'test-username',
      tracks: [
        {
          _id: testTrack1._id.toString(),
          name: 'Track 1',
          mode: 'choir',
          waveform: 'sine',
          ttsRate: '1.5',
          userId: testUser._id.toString(),
          isPublic: true
        },
        {
          _id: testTrack2._id.toString(),
          name: 'Track 2',
          mode: 'choir',
          waveform: 'sine',
          ttsRate: '1',
          userId: testUser._id.toString(),
          isPublic: false,
          notes: 'test-notes'
        }
      ]
    })
  })

  it('should return error response if fetching performance fails', async () => {
    SadissPerformance.findById = jest.fn().mockImplementationOnce(() => {
      throw new Error('Server error')
    })

    const mockId = generateMockId()

    const res = await authenticatedRequest(request, `/api/performance/${mockId}`, 'get').expect(500)
    expect(res.body).toEqual({ Error: 'Failed fetching performance.' })
    expect(SadissPerformance.findById).toHaveBeenCalledWith(mockId)
  })
})
