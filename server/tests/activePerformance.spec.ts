import { initializeActivePerformance } from '../services/activePerformanceService'
import { createTestTrackPerformance, createWebSocketClient } from './testUtils'
import { readAndParseChunkFile } from '../services/fileService'

describe('activePerformance test', () => {
  describe('startSendingInterval', () => {
    it('choir mode: correctly distributes chunks', async () => {
      //TODO: This is unfinished
      expect(true).toBe(true)

      return

      const { performanceId, tracks } = await createTestTrackPerformance()
      const activePerformance = initializeActivePerformance(performanceId)
      activePerformance.trackMode = 'nonChoir'

      const track = tracks[0]
      const chunks = await readAndParseChunkFile(track)

      const wsClient1 = await createWebSocketClient(performanceId.toString())
      const wsClient2 = await createWebSocketClient(performanceId.toString(), 1)

      activePerformance.loadTrack(chunks!, track.mode, track.waveform, track.ttsRate, 0)
      activePerformance.startSendingInterval(0, global.testWss, false, track._id.toString())

      jest.advanceTimersByTime(10000)
    })
  })
})
