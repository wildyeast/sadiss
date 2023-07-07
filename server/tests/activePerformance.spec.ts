import { ActivePerformance } from '../activePerformance'
import { createMockWsClient, generateMockId } from './testUtils'
import { Frame, PartialChunk, TrackMode } from '../types/types'
import * as fs from 'fs'

describe('activePerformance test', () => {
  describe('startSendingInterval test', () => {
    beforeAll(() => {
      jest.useFakeTimers()
    })

    it('should send start signal to all clients', () => {
      const trackMode = 'choir'
      const waveform = 'sine'
      const ttsRate = '1'

      const { activePerformance } = preparePerformance(
        'tests/testFiles/testChunkFile_shortOnePartial.json',
        trackMode,
        waveform,
        ttsRate
      )

      // Add clients to wss
      const testAdminClient = createMockWsClient(activePerformance.id, 0, true)
      const testClient = createMockWsClient(activePerformance.id, 0)

      activePerformance.startSendingInterval(0, false, generateMockId())
      jest.advanceTimersByTime(1000)
      expect(testAdminClient.send).toHaveBeenNthCalledWith(1, JSON.stringify({ start: true }))
      expect(testClient.send).toHaveBeenNthCalledWith(1, JSON.stringify({ start: true }))
    })

    it('choir mode: should send partials to clients in the performance that are not admins', () => {
      const trackMode = 'choir'
      const waveform = 'sine'
      const ttsRate = '1'

      const { activePerformance, chunks } = preparePerformance(
        'tests/testFiles/testChunkFile_shortOnePartial.json',
        trackMode,
        waveform,
        ttsRate
      )

      const totalChunks = chunks.length

      // Add clients to wss
      const testClient = createMockWsClient(activePerformance.id, 0, false)
      const testAdminClient = createMockWsClient(activePerformance.id, 0, true)

      // Start sending interval
      const startTime = 0
      const mockTrackId = generateMockId()
      const loopTrack = false
      activePerformance.startSendingInterval(startTime, loopTrack, mockTrackId)

      const sendingIntevalLength = 1000 // ms

      jest.advanceTimersByTime(sendingIntevalLength)

      const TIME_ADDED_TO_START = 2 // seconds

      let partialForTestClient = chunks[0]?.partials.find((chunk: PartialChunk) => chunk.index === testClient.choirId)
      expect(testClient.send).toHaveBeenNthCalledWith(
        2,
        JSON.stringify({
          startTime: startTime + TIME_ADDED_TO_START,
          waveform,
          ttsRate,
          chunk: { partials: [partialForTestClient] }
        })
      )
      expect(testAdminClient.send).toHaveBeenNthCalledWith(
        2,
        JSON.stringify({
          chunkIndex: 0,
          totalChunks,
          trackId: mockTrackId,
          loop: loopTrack
        })
      )

      jest.advanceTimersByTime(sendingIntevalLength)

      partialForTestClient = chunks[1]?.partials.find((chunk: PartialChunk) => chunk.index === testClient.choirId)
      expect(testClient.send).toHaveBeenNthCalledWith(
        3,
        JSON.stringify({
          startTime: startTime + TIME_ADDED_TO_START,
          waveform,
          ttsRate,
          chunk: { partials: [partialForTestClient] }
        })
      )
      expect(testAdminClient.send).toHaveBeenNthCalledWith(
        3,
        JSON.stringify({
          chunkIndex: 1,
          totalChunks,
          trackId: mockTrackId,
          loop: loopTrack
        })
      )
    })

    it('choir mode: should send tts instructions to clients in the performance that are not admins', () => {
      const trackMode = 'choir'
      const waveform = 'sine'
      const ttsRate = '1'

      const { activePerformance, chunks } = preparePerformance(
        'tests/testFiles/testChunkFile_ttsTwoVoicesTwoLanguages.json',
        trackMode,
        waveform,
        ttsRate
      )

      const totalChunks = chunks.length

      // Add clients to wss
      const testClient = createMockWsClient(activePerformance.id, 0, false, { iso: 'en-US', lang: 'English' })
      const testClient2 = createMockWsClient(activePerformance.id, 0, false, { iso: 'de-DE', lang: 'Deutsch' })
      const testAdminClient = createMockWsClient(activePerformance.id, 0, true)

      // Start sending interval
      const startTime = 0
      const mockTrackId = generateMockId()
      const loopTrack = false
      activePerformance.startSendingInterval(startTime, loopTrack, mockTrackId)

      const oneMinuteInMs = 60000
      jest.advanceTimersByTime(oneMinuteInMs)

      const TIME_ADDED_TO_START = 2 // seconds

      const allTtsInstructions = chunks
        .filter((chunk: Frame) => chunk && chunk.ttsInstructions)
        .map((chunk: Frame) => chunk.ttsInstructions)

      // First chunk
      expect(testClient.send).toHaveBeenNthCalledWith(
        2,
        JSON.stringify({
          startTime: startTime + TIME_ADDED_TO_START,
          waveform,
          ttsRate,
          chunk: { ttsInstructions: allTtsInstructions[0][testClient.choirId][testClient.ttsLang.iso] }
        })
      )
      expect(testClient2.send).toHaveBeenNthCalledWith(
        2,
        JSON.stringify({
          startTime: startTime + TIME_ADDED_TO_START,
          waveform,
          ttsRate,
          chunk: { ttsInstructions: allTtsInstructions[0][testClient2.choirId][testClient2.ttsLang.iso] }
        })
      )
      expect(testAdminClient.send).toHaveBeenNthCalledWith(
        2,
        JSON.stringify({
          chunkIndex: 0,
          totalChunks,
          trackId: mockTrackId,
          loop: loopTrack
        })
      )

      // Second chunk
      expect(testClient.send).toHaveBeenNthCalledWith(
        3,
        JSON.stringify({
          startTime: startTime + TIME_ADDED_TO_START,
          waveform,
          ttsRate,
          chunk: { ttsInstructions: allTtsInstructions[1][testClient.choirId][testClient.ttsLang.iso] }
        })
      )
      expect(testClient2.send).toHaveBeenNthCalledWith(
        3,
        JSON.stringify({
          startTime: startTime + TIME_ADDED_TO_START,
          waveform,
          ttsRate,
          chunk: { ttsInstructions: allTtsInstructions[1][testClient2.choirId][testClient2.ttsLang.iso] }
        })
      )
      expect(testAdminClient.send).toHaveBeenNthCalledWith(
        3,
        JSON.stringify({
          chunkIndex: 1,
          totalChunks,
          trackId: mockTrackId,
          loop: loopTrack
        })
      )

      // Third chunk
      expect(testClient.send).toHaveBeenNthCalledWith(
        4,
        JSON.stringify({
          startTime: startTime + TIME_ADDED_TO_START,
          waveform,
          ttsRate,
          chunk: { ttsInstructions: allTtsInstructions[2][testClient.choirId][testClient.ttsLang.iso] }
        })
      )
      expect(testClient2.send).toHaveBeenNthCalledWith(
        4,
        JSON.stringify({
          startTime: startTime + TIME_ADDED_TO_START,
          waveform,
          ttsRate,
          chunk: { ttsInstructions: allTtsInstructions[2][testClient2.choirId][testClient2.ttsLang.iso] }
        })
      )
      expect(testAdminClient.send).toHaveBeenNthCalledWith(
        4,
        JSON.stringify({
          chunkIndex: 2,
          totalChunks,
          trackId: mockTrackId,
          loop: loopTrack
        })
      )
    })

    // it('should not send partials and ttsInstructions to admin clients', () => {
    //   // TODO
    //   expect(true).toBe(false)
    // })

    // it('should not send partials and ttsInstructions to clients of other performances', () => {
    //   // TODO
    //   expect(true).toBe(false)
    // })

    // Helpers
    const preparePerformance = (chunkFilePath: string, mode: TrackMode, waveform: OscillatorType, ttsRate: string) => {
      const testPerformanceId = generateMockId()
      const data = fs.readFileSync(chunkFilePath, 'utf8')
      const chunks: Frame[] = JSON.parse(data)

      const activePerformance = new ActivePerformance(testPerformanceId, testWss)
      activePerformance.loadedTrack = chunks
      activePerformance.trackMode = mode
      activePerformance.trackWaveform = waveform
      activePerformance.trackTtsRate = ttsRate

      return { activePerformance, chunks }
    }
  })
})
