import mongoose, { Types } from 'mongoose'

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
    isPublic: true
  }

  const req = agent
    .post('/api/track/create')
    .field('name', testTrack.name)
    .field('mode', testTrack.mode)
    .field('waveform', testTrack.waveform)
    .field('isPublic', testTrack.isPublic)

  if (trackType === 'partials') {
    req.attach('files', 'tests/testFiles/testPartialFile.txt', 'partialfile_testPartialFile')
  } else if (trackType === 'tts') {
    req.attach('files', 'tests/testFiles/testSrtFile.txt', 'ttsfile_0_en-US_testSrtFile')
  } else if (trackType === 'partialsAndTts') {
    req
      .attach('files', 'tests/testFiles/testPartialFile.txt', 'partialfile_testPartialFile')
      .attach('files', 'tests/testFiles/testSrtFile.txt', 'ttsfile_0_en-US_testSrtFile')
  }

  const resCreate: { body: { _id: Types.ObjectId } } = await req.expect(201)

  return resCreate.body._id
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

export const createTestTrackPerformance = async () => {
  const trackId = await createTestTrack()
  const performanceId = await createTestPerformance()

  const res: { body: { trackPerformance: { _id: Types.ObjectId } } } = await agent
    .post('/api/add-track-to-performance')!
    .send({
      trackId,
      performanceId
    })
    .expect(201)

  return { trackId, performanceId, trackPerformanceId: res.body.trackPerformance._id }
}

export const createMockWsClient = (
  performanceId: Types.ObjectId,
  choirId: number,
  isAdmin = false,
  ttsLang = { iso: 'en-US', lang: 'English' }
) => {
  const mockClient = {
    id: generateMockId(),
    readyState: 1,
    performanceId,
    choirId,
    isAdmin,
    ttsLang,
    send: jest.fn()
  }
  testWss.clients.add(mockClient as any)
  return mockClient
}
