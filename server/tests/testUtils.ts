import mongoose from 'mongoose'

/**
 * Returns a MongoDB ObjectId. This is used to mock MongoDB ids in tests.
 */
export const generateMockId = () => new mongoose.Types.ObjectId()

// Helpers
export let testTrackId = ''
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

  const resCreate = await req.expect(201)

  testTrackId = resCreate.body._id
}

export let testPerformanceId = ''
export const createTestPerformance = async () => {
  const testPerformance = {
    name: 'test performance',
    isPublic: true
  }

  const resCreate = await agent.post('/api/performance/create')!.send(testPerformance).expect(201)

  testPerformanceId = resCreate.body._id
  return resCreate.body._id
}

export let testTrackPerformanceId = ''
export const createTestTrackPerformance = async () => {
  await createTestTrack()
  await createTestPerformance()

  const resAddTrackToPerformance = await agent
    .post('/api/add-track-to-performance')!
    .send({
      trackId: testTrackId,
      performanceId: testPerformanceId
    })
    .expect(201)

  testTrackPerformanceId = resAddTrackToPerformance.body.trackPerformance._id
}

export const resetTestIds = () => {
  testTrackId = ''
  testPerformanceId = ''
  testTrackPerformanceId = ''
}
