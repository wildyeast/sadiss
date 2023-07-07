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

      const { activePerformance, chunks } = preparePerformance(
        'tests/testFiles/testChunkFile_shortTwoPartials.json',
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

    it('should send partials and ttsInstructions to clients in the performance that are not admins', () => {
      const trackMode = 'choir'
      const waveform = 'sine'
      const ttsRate = '1'

      const { activePerformance, chunks } = preparePerformance(
        'tests/testFiles/testChunkFile_shortTwoPartials.json',
        trackMode,
        waveform,
        ttsRate
      )

      // Add clients to wss
      const testClient = createMockWsClient(activePerformance.id, 0)

      // Start sending interval
      const startTime = 0
      activePerformance.startSendingInterval(startTime, false, generateMockId())
      jest.advanceTimersByTime(1000)

      const TIME_ADDED_TO_START = 2 // seconds

      const partialForTestClient = chunks[0]?.partials.find((chunk: PartialChunk) => chunk.index === testClient.choirId)
      expect(testClient.send).toHaveBeenNthCalledWith(
        2,
        JSON.stringify({
          startTime: startTime + TIME_ADDED_TO_START,
          waveform,
          ttsRate,
          chunk: { partials: [partialForTestClient] }
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
