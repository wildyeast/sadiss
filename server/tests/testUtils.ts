import mongoose, { Types } from 'mongoose'
import { TrackDocument, TrackPerformanceDocument } from '../types/types'
import WebSocket from 'ws'
import { logger } from '../tools'

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

export const createWebSocketClient = (performanceId: string, choirId = 0, selectedLanguage = 'en-US') => {
  const wssPort = (global.testWss.address() as WebSocket.AddressInfo).port

  // Return a Promise that resolves when the WebSocket connection is open
  return new Promise<WebSocket>((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:${wssPort}/`)

    ws.onopen = function () {
      this.send(
        JSON.stringify({
          message: 'clientInfo',
          clientId: choirId,
          ttsLang: selectedLanguage,
          performanceId: performanceId
        })
      )
    }

    ws.onerror = function (error) {
      // Reject the Promise if there's an error during the WebSocket connection
      reject(error)
    }

    ws.onmessage = function (event) {
      // logger.debug(`Received message from ws server: ${event.data}`)

      if (event.data && event.data === 'clientInfoReceived') {
        // Resolve the Promise with the WebSocket instance when the connection is open
        resolve(ws)
      }
    }
  })
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
