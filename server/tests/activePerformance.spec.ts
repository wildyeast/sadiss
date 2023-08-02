import { ActivePerformance } from '../activePerformance'
import { createMockWsClient, generateMockId } from './testUtils'
import { Frame, PartialChunk, TrackMode } from '../types/types'
import * as fs from 'fs'

describe('activePerformance test', () => {
  describe('startSendingInterval test', () => {
    const TIME_ADDED_TO_START = 2 // seconds
    const ONE_MINUTE_IN_MS = 60000
    const SENDING_INTERVAL_LENGTH_IN_MS = 1000

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

      const mockTrackId = generateMockId()
      const loopTrack = false
      startSendingInterval(activePerformance, mockTrackId, loopTrack)

      jest.advanceTimersByTime(SENDING_INTERVAL_LENGTH_IN_MS)

      let partialForTestClient = chunks[0]?.partials.find((chunk: PartialChunk) => chunk.index === testClient.choirId)
      expect(testClient.send).toHaveBeenNthCalledWith(
        2,
        JSON.stringify({
          startTime: TIME_ADDED_TO_START,
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

      jest.advanceTimersByTime(SENDING_INTERVAL_LENGTH_IN_MS)

      partialForTestClient = chunks[1]?.partials.find((chunk: PartialChunk) => chunk.index === testClient.choirId)
      expect(testClient.send).toHaveBeenNthCalledWith(
        3,
        JSON.stringify({
          startTime: TIME_ADDED_TO_START,
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
      const testClient2 = createMockWsClient(activePerformance.id, 1, false, { iso: 'de-DE', lang: 'Deutsch' })
      const testAdminClient = createMockWsClient(activePerformance.id, 0, true)

      // Start sending interval
      const mockTrackId = generateMockId()
      const loopTrack = false
      startSendingInterval(activePerformance, mockTrackId, loopTrack)

      jest.advanceTimersByTime(ONE_MINUTE_IN_MS)

      const allTtsInstructions = chunks
        .filter((chunk: Frame) => chunk && chunk.ttsInstructions)
        .map((chunk: Frame) => chunk.ttsInstructions)

      // First chunk
      expect(testClient.send).toHaveBeenNthCalledWith(
        2,
        JSON.stringify({
          startTime: TIME_ADDED_TO_START,
          waveform,
          ttsRate,
          chunk: { ttsInstructions: allTtsInstructions[0][testClient.choirId][testClient.ttsLang.iso] }
        })
      )
      expect(testClient2.send).toHaveBeenNthCalledWith(
        2,
        JSON.stringify({
          startTime: TIME_ADDED_TO_START,
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
          startTime: TIME_ADDED_TO_START,
          waveform,
          ttsRate,
          chunk: { ttsInstructions: allTtsInstructions[1][testClient.choirId][testClient.ttsLang.iso] }
        })
      )
      expect(testClient2.send).toHaveBeenNthCalledWith(
        3,
        JSON.stringify({
          startTime: TIME_ADDED_TO_START,
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
          startTime: TIME_ADDED_TO_START,
          waveform,
          ttsRate,
          chunk: { ttsInstructions: allTtsInstructions[2][testClient.choirId][testClient.ttsLang.iso] }
        })
      )
      expect(testClient2.send).toHaveBeenNthCalledWith(
        4,
        JSON.stringify({
          startTime: TIME_ADDED_TO_START,
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

    it('choir mode: should send partials and tts instructions to clients in the performance that are not admins', () => {
      const trackMode = 'choir'
      const waveform = 'sine'
      const ttsRate = '1'

      const { activePerformance, chunks } = preparePerformance(
        'tests/testFiles/testChunkFile_twoShortPartialsTwoVoicesTwoLanguages.json',
        trackMode,
        waveform,
        ttsRate
      )

      const totalChunks = chunks.length

      // Add clients to wss
      const testClient = createMockWsClient(activePerformance.id, 0, false, { iso: 'en-US', lang: 'English' })
      const testClient2 = createMockWsClient(activePerformance.id, 1, false, { iso: 'de-DE', lang: 'Deutsch' })
      const testAdminClient = createMockWsClient(activePerformance.id, 0, true)

      const mockTrackId = generateMockId()
      const loopTrack = false
      startSendingInterval(activePerformance, mockTrackId, loopTrack)

      jest.advanceTimersByTime(ONE_MINUTE_IN_MS)

      const allTtsInstructions = chunks
        .filter((chunk: Frame) => chunk && chunk.ttsInstructions)
        .map((chunk: Frame) => chunk.ttsInstructions)

      // First chunk
      let partialForTestClient = chunks[0]?.partials.find((chunk: PartialChunk) => chunk.index === testClient.choirId)
      expect(testClient.send).toHaveBeenNthCalledWith(
        2,
        JSON.stringify({
          startTime: TIME_ADDED_TO_START,
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

      // Second chunk
      partialForTestClient = chunks[1]?.partials.find((chunk: PartialChunk) => chunk.index === testClient.choirId)
      expect(testClient.send).toHaveBeenNthCalledWith(
        3,
        JSON.stringify({
          startTime: TIME_ADDED_TO_START,
          waveform,
          ttsRate,
          // chunk: { ttsInstructions: allTtsInstructions[1][testClient.choirId][testClient.ttsLang.iso] }
          chunk: { partials: [partialForTestClient] }
        })
      )
      partialForTestClient = chunks[1]?.partials.find((chunk: PartialChunk) => chunk.index === testClient2.choirId)
      expect(testClient2.send).toHaveBeenNthCalledWith(
        2,
        JSON.stringify({
          startTime: TIME_ADDED_TO_START,
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

      // Third chunk
      expect(testClient.send).toHaveBeenNthCalledWith(
        4,
        JSON.stringify({
          startTime: TIME_ADDED_TO_START,
          waveform,
          ttsRate,
          chunk: { ttsInstructions: allTtsInstructions[2][testClient.choirId][testClient.ttsLang.iso] }
        })
      )
      expect(testClient2.send).toHaveBeenNthCalledWith(
        3,
        JSON.stringify({
          startTime: TIME_ADDED_TO_START,
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

      // Fourth chunk
      expect(testClient.send).toHaveBeenNthCalledWith(
        5,
        JSON.stringify({
          startTime: TIME_ADDED_TO_START,
          waveform,
          ttsRate,
          chunk: { ttsInstructions: allTtsInstructions[3][testClient.choirId][testClient.ttsLang.iso] }
        })
      )
      expect(testClient2.send).toHaveBeenNthCalledWith(
        4,
        JSON.stringify({
          startTime: TIME_ADDED_TO_START,
          waveform,
          ttsRate,
          chunk: { ttsInstructions: allTtsInstructions[3][testClient2.choirId][testClient2.ttsLang.iso] }
        })
      )
      expect(testAdminClient.send).toHaveBeenNthCalledWith(
        5,
        JSON.stringify({
          chunkIndex: 3,
          totalChunks,
          trackId: mockTrackId,
          loop: loopTrack
        })
      )

      // Fifth chunk
      expect(testClient.send).toHaveBeenNthCalledWith(
        6,
        JSON.stringify({
          startTime: TIME_ADDED_TO_START,
          waveform,
          ttsRate,
          chunk: { ttsInstructions: allTtsInstructions[4][testClient.choirId][testClient.ttsLang.iso] }
        })
      )
      expect(testClient2.send).toHaveBeenNthCalledWith(
        5,
        JSON.stringify({
          startTime: TIME_ADDED_TO_START,
          waveform,
          ttsRate,
          chunk: { ttsInstructions: allTtsInstructions[4][testClient2.choirId][testClient2.ttsLang.iso] }
        })
      )
      expect(testAdminClient.send).toHaveBeenNthCalledWith(
        6,
        JSON.stringify({
          chunkIndex: 4,
          totalChunks,
          trackId: mockTrackId,
          loop: loopTrack
        })
      )
    })

    it('non-choir mode: should send same partial data to all clients in the performance', () => {
      const trackMode: TrackMode = 'nonChoir'
      const waveform = 'sine'
      const ttsRate = '1'

      const { activePerformance, chunks } = preparePerformance(
        'tests/testFiles/testChunkFile_shortOnePartial.json',
        trackMode,
        waveform,
        ttsRate
      )

      // Add clients to wss
      const testClient = createMockWsClient(activePerformance.id, 0, false)
      const testClient2 = createMockWsClient(activePerformance.id, 1, false)

      startSendingInterval(activePerformance)

      jest.advanceTimersByTime(ONE_MINUTE_IN_MS)

      let expectedPartials = chunks[0]?.partials
      expect(testClient.send).toHaveBeenNthCalledWith(
        2,
        JSON.stringify({
          startTime: TIME_ADDED_TO_START,
          waveform,
          ttsRate,
          chunk: { partials: expectedPartials }
        })
      )
      expect(testClient2.send).toHaveBeenNthCalledWith(
        2,
        JSON.stringify({
          startTime: TIME_ADDED_TO_START,
          waveform,
          ttsRate,
          chunk: { partials: expectedPartials }
        })
      )

      jest.advanceTimersByTime(SENDING_INTERVAL_LENGTH_IN_MS)

      expectedPartials = chunks[1]?.partials
      expect(testClient.send).toHaveBeenNthCalledWith(
        3,
        JSON.stringify({
          startTime: TIME_ADDED_TO_START,
          waveform,
          ttsRate,
          chunk: { partials: expectedPartials }
        })
      )
      expect(testClient2.send).toHaveBeenNthCalledWith(
        3,
        JSON.stringify({
          startTime: TIME_ADDED_TO_START,
          waveform,
          ttsRate,
          chunk: { partials: expectedPartials }
        })
      )
    })

    it('non-choir mode: should send same tts instructions to all clients in the performance', () => {
      const trackMode: TrackMode = 'nonChoir'
      const waveform = 'sine'
      const ttsRate = '1'

      const { activePerformance, chunks } = preparePerformance(
        'tests/testFiles/testChunkFile_ttsOneVoiceTwoLanguages.json',
        trackMode,
        waveform,
        ttsRate
      )

      // Add clients to wss
      const testClient = createMockWsClient(activePerformance.id, 0, false, { iso: 'en-US', lang: 'English' })
      const testClient2 = createMockWsClient(activePerformance.id, 1, false, { iso: 'de-DE', lang: 'Deutsch' })

      startSendingInterval(activePerformance)

      jest.advanceTimersByTime(ONE_MINUTE_IN_MS)

      const allTtsInstructions = chunks
        .filter((chunk: Frame) => chunk && chunk.ttsInstructions)
        .map((chunk: Frame) => chunk.ttsInstructions)

      // Always only one voice in nonChoir mode
      const firstAndOnlyTtsVoice = 0

      expect(testClient.send).toHaveBeenNthCalledWith(
        2,
        JSON.stringify({
          startTime: TIME_ADDED_TO_START,
          waveform,
          ttsRate,
          chunk: { partials: [], ttsInstructions: allTtsInstructions[0][firstAndOnlyTtsVoice][testClient.ttsLang.iso] }
        })
      )
      expect(testClient2.send).toHaveBeenNthCalledWith(
        2,
        JSON.stringify({
          startTime: TIME_ADDED_TO_START,
          waveform,
          ttsRate,
          chunk: { partials: [], ttsInstructions: allTtsInstructions[0][firstAndOnlyTtsVoice][testClient2.ttsLang.iso] }
        })
      )

      jest.advanceTimersByTime(SENDING_INTERVAL_LENGTH_IN_MS)

      expect(testClient.send).toHaveBeenNthCalledWith(
        3,
        JSON.stringify({
          startTime: TIME_ADDED_TO_START,
          waveform,
          ttsRate,
          chunk: { partials: [], ttsInstructions: allTtsInstructions[1][firstAndOnlyTtsVoice][testClient.ttsLang.iso] }
        })
      )
      expect(testClient2.send).toHaveBeenNthCalledWith(
        3,
        JSON.stringify({
          startTime: TIME_ADDED_TO_START,
          waveform,
          ttsRate,
          chunk: { partials: [], ttsInstructions: allTtsInstructions[1][firstAndOnlyTtsVoice][testClient2.ttsLang.iso] }
        })
      )
    })

    it('non-choir mode: should send same partials and tts instructions to all clients in the performance', () => {
      const trackMode: TrackMode = 'nonChoir'
      const waveform = 'sine'
      const ttsRate = '1'

      const { activePerformance, chunks } = preparePerformance(
        'tests/testFiles/testChunkFile_twoShortPartialsOneVoiceTwoLanguages.json',
        trackMode,
        waveform,
        ttsRate
      )

      // Add clients to wss
      const testClient = createMockWsClient(activePerformance.id, 0, false, { iso: 'en-US', lang: 'English' })
      const testClient2 = createMockWsClient(activePerformance.id, 1, false, { iso: 'de-DE', lang: 'Deutsch' })

      startSendingInterval(activePerformance)

      jest.advanceTimersByTime(ONE_MINUTE_IN_MS)

      const allTtsInstructions = chunks
        .filter((chunk: Frame) => chunk && chunk.ttsInstructions)
        .map((chunk: Frame) => chunk.ttsInstructions)

      // Always only one voice in nonChoir mode
      const firstAndOnlyTtsVoice = 0

      const expectedPartials = chunks[0]?.partials
      expect(testClient.send).toHaveBeenNthCalledWith(
        2,
        JSON.stringify({
          startTime: TIME_ADDED_TO_START,
          waveform,
          ttsRate,
          chunk: {
            partials: expectedPartials
          }
        })
      )
      expect(testClient2.send).toHaveBeenNthCalledWith(
        2,
        JSON.stringify({
          startTime: TIME_ADDED_TO_START,
          waveform,
          ttsRate,
          chunk: {
            partials: expectedPartials
          }
        })
      )

      jest.advanceTimersByTime(SENDING_INTERVAL_LENGTH_IN_MS * 2)

      expect(testClient.send).toHaveBeenNthCalledWith(
        4,
        JSON.stringify({
          startTime: TIME_ADDED_TO_START,
          waveform,
          ttsRate,
          chunk: {
            partials: [],
            ttsInstructions: allTtsInstructions[2][firstAndOnlyTtsVoice][testClient.ttsLang.iso]
          }
        })
      )
      expect(testClient2.send).toHaveBeenNthCalledWith(
        4,
        JSON.stringify({
          startTime: TIME_ADDED_TO_START,
          waveform,
          ttsRate,
          chunk: {
            partials: [],
            ttsInstructions: allTtsInstructions[2][firstAndOnlyTtsVoice][testClient2.ttsLang.iso]
          }
        })
      )
    })

    it('should not start sending interval if already started', () => {
      const trackMode = 'choir'
      const waveform = 'sine'
      const ttsRate = '1'

      const { activePerformance } = preparePerformance(
        'tests/testFiles/testChunkFile_shortOnePartial.json',
        trackMode,
        waveform,
        ttsRate
      )

      activePerformance.startSendingInterval(0, false, generateMockId())

      expect(activePerformance.startSendingInterval(0, false, generateMockId())).toBe(false)
    })

    it('should reset chunkIndex to 0 if loop is true', () => {
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

      const testClient = createMockWsClient(activePerformance.id, 0, false)

      const mockTrackId = generateMockId()
      const loopTrack = true
      startSendingInterval(activePerformance, mockTrackId, loopTrack)

      jest.advanceTimersByTime(SENDING_INTERVAL_LENGTH_IN_MS * (totalChunks + 1))

      const expectedPartials = chunks[0]?.partials
      expect(testClient.send).toHaveBeenNthCalledWith(
        4,
        JSON.stringify({
          startTime: TIME_ADDED_TO_START + totalChunks,
          waveform,
          ttsRate,
          chunk: { partials: expectedPartials }
        })
      )
    })

    it('should give all partials to a client if there is only one client and give a client joining late only one partial', () => {
      const trackMode = 'choir'
      const waveform = 'sine'
      const ttsRate = '1'

      const { activePerformance, chunks } = preparePerformance(
        'tests/testFiles/testChunkFile_twoShortPartialsTwoVoicesTwoLanguages.json',
        trackMode,
        waveform,
        ttsRate
      )

      const testClient = createMockWsClient(activePerformance.id, 0, false)

      const mockTrackId = generateMockId()
      const loopTrack = false
      startSendingInterval(activePerformance, mockTrackId, loopTrack)

      jest.advanceTimersByTime(SENDING_INTERVAL_LENGTH_IN_MS)

      const expectedPartials = chunks[0]?.partials
      expect(testClient.send).toHaveBeenNthCalledWith(
        2,
        JSON.stringify({
          startTime: TIME_ADDED_TO_START,
          waveform,
          ttsRate,
          chunk: { partials: expectedPartials }
        })
      )

      const testClient2 = createMockWsClient(activePerformance.id, 1, false)

      jest.advanceTimersByTime(SENDING_INTERVAL_LENGTH_IN_MS)

      const expectedPartialsForClient2 = chunks[1]?.partials[1]
      expect(testClient2.send).toHaveBeenNthCalledWith(
        1,
        JSON.stringify({
          startTime: TIME_ADDED_TO_START,
          waveform,
          ttsRate,
          chunk: { partials: [expectedPartialsForClient2] }
        })
      )
    })

    it('should give partials that were distributed last iteration to the client with the least amount of partials if the clients the partials were distributed to before have disconnected', () => {
      const trackMode = 'choir'
      const waveform = 'sine'
      const ttsRate = '1'

      const { activePerformance, chunks } = preparePerformance(
        'tests/testFiles/testChunkFile_two6sPartials.json',
        trackMode,
        waveform,
        ttsRate
      )

      const testClient = createMockWsClient(activePerformance.id, 0, false)
      createMockWsClient(activePerformance.id, 0, false)

      const mockTrackId = generateMockId()
      const loopTrack = false
      startSendingInterval(activePerformance, mockTrackId, loopTrack)

      jest.advanceTimersByTime(SENDING_INTERVAL_LENGTH_IN_MS)

      const testClient2 = createMockWsClient(activePerformance.id, 0, false)

      jest.advanceTimersByTime(SENDING_INTERVAL_LENGTH_IN_MS)

      testWss.clients.delete(testClient as any)

      jest.advanceTimersByTime(SENDING_INTERVAL_LENGTH_IN_MS)

      const expectedPartials = chunks[3]?.partials
      expect(testClient2.send).toHaveBeenNthCalledWith(
        3,
        JSON.stringify({
          startTime: TIME_ADDED_TO_START,
          waveform,
          ttsRate,
          chunk: { partials: [expectedPartials] }
        })
      )
    })

    // it('should not start sending interval if no track is loaded', () => {// TODO})

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

    const startSendingInterval = (
      activePerformance: ActivePerformance,
      mockTrackId = generateMockId(),
      loopTrack = false,
      startTime = 0
    ) => {
      activePerformance.startSendingInterval(startTime, loopTrack, mockTrackId)
    }
  })
})
