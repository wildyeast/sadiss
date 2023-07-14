import { SadissPerformance, User, TrackPerformance, Track } from '../models'
import { generateMockId } from './testUtils'

describe('getPerformanceWithTracks', () => {
  it('should return performance data with associated tracks in correct order', async () => {
    const testUser = new User({
      username: 'test-username',
      password: 'test-password',
      email: 'test@email.com'
    })
    await testUser.save()

    const testPerformance = new SadissPerformance({
      name: 'Performance 1',
      creator: testUser._id,
      isPublic: true
    })
    await testPerformance.save()

    const testTrack1 = new Track({
      name: 'Track 1',
      mode: 'choir',
      waveform: 'sine',
      ttsRate: 1.5,
      creator: testUser._id,
      isPublic: true
    })
    await testTrack1.save()

    const trackPerformance = new TrackPerformance({
      track: testTrack1._id,
      performance: testPerformance._id,
      sortOrder: 2
    })
    await trackPerformance.save()

    const testTrack2 = new Track({
      name: 'Track 2',
      mode: 'choir',
      waveform: 'sine',
      ttsRate: '1',
      creator: testUser._id,
      isPublic: false,
      notes: 'test-notes'
    })
    await testTrack2.save()

    const trackPerformance2 = new TrackPerformance({
      track: testTrack2._id,
      performance: testPerformance._id,
      sortOrder: 1
    })
    await trackPerformance2.save()

    const res = await agent.get(`/api/performance/${testPerformance._id}/with-tracks`).expect(200)

    expect(res.body).toEqual({
      performance: {
        _id: testPerformance._id.toString(),
        name: 'Performance 1',
        creator: { username: 'test-username' },
        tracks: [
          {
            _id: testTrack2._id.toString(),
            name: 'Track 2',
            mode: 'choir',
            waveform: 'sine',
            ttsRate: '1',
            creator: testUser._id.toString(),
            isPublic: false,
            notes: 'test-notes',
            sortOrder: 1,
            trackPerformanceId: trackPerformance2._id.toString()
          },
          {
            _id: testTrack1._id.toString(),
            name: 'Track 1',
            mode: 'choir',
            waveform: 'sine',
            ttsRate: '1.5',
            creator: testUser._id.toString(),
            isPublic: true,
            sortOrder: 2,
            trackPerformanceId: trackPerformance._id.toString()
          }
        ]
      }
    })
  })

  it('should return error response if fetching performance fails', async () => {
    SadissPerformance.findById = jest.fn().mockImplementationOnce(() => {
      throw new Error('Server error')
    })

    const mockId = generateMockId()

    const res = await agent.get(`/api/performance/${mockId}`).expect(500)
    expect(res.body).toEqual({ Error: 'Failed fetching performance.' })
    expect(SadissPerformance.findById).toHaveBeenCalledWith(mockId.toString())
  })
})
