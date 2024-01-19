import mongoose, { Types } from 'mongoose'
import { TrackDocument, TrackPerformanceDocument } from '../types/types'

/**
 * Returns a MongoDB ObjectId. This is used to mock MongoDB ids in tests.
 */
export const generateMockId = () => new mongoose.Types.ObjectId()

// Helpers
export const createTestTrack = async (trackType: 'partials' | 'tts' | 'partialsAndTts' = 'partialsAndTts') => {
  const testTrack = {
    name: 'test track',
    mode: 'choir',
    waveform: 'sine',
    isPublic: true,
    ttsRate: '1.0',
    notes: 'test notes'
  }

  const req = agent
    .post('/api/track/create')
    .field('name', testTrack.name)
    .field('mode', testTrack.mode)
    .field('waveform', testTrack.waveform)
    .field('isPublic', testTrack.isPublic)
    .field('ttsRate', testTrack.ttsRate)
    .field('notes', testTrack.notes)

  if (trackType === 'partials') {
    req.attach('files', 'tests/testFiles/testPartialFile.txt', 'partialfile_testPartialFile')
  } else if (trackType === 'tts') {
    req.attach('files', 'tests/testFiles/testSrtFile.txt', 'ttsfile_0_en-US_testSrtFile')
  } else if (trackType === 'partialsAndTts') {
    req
      .attach('files', 'tests/testFiles/testPartialFile.txt', 'partialfile_testPartialFile')
      .attach('files', 'tests/testFiles/testSrtFile.txt', 'ttsfile_0_en-US_testSrtFile')
  }

  const resCreate: { body: TrackDocument } = await req.expect(201)

  return resCreate.body
}

export const createTestPerformance = async () => {
  const testPerformance = {
    name: 'test performance',
    isPublic: true
  }

  const resCreate: { body: { _id: Types.ObjectId } } = await agent
    .post('/api/performance/create')!
    .send(testPerformance)
    .expect(201)

  return resCreate.body._id
}

export const createTestTrackPerformance = async (tracksToCreateCount = 1) => {
  const tracks: TrackDocument[] = []
  for (let i = 0; i < tracksToCreateCount; i++) {
    tracks.push(await createTestTrack())
  }
  const performanceId = await createTestPerformance()

  const trackPerformances: TrackPerformanceDocument[] = []

  for (const track of tracks) {
    const res: { body: { trackPerformance: TrackPerformanceDocument } } = await agent.post('/api/add-track-to-performance').send({
      trackId: track._id,
      performanceId
    })

    trackPerformances.push(res.body.trackPerformance)
  }

  return { tracks, performanceId, trackPerformances }
}
