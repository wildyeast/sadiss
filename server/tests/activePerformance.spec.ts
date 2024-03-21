import { initializeActivePerformance } from '../services/activePerformanceService'
import { createTestTrackPerformance, createWebSocketClient } from './testUtils'
import { readAndParseChunkFile } from '../services/fileService'

describe('activePerformance test', () => {
  describe('startSendingInterval', () => {
    it('choir mode: correctly distributes chunks', async () => {
      const { performanceId, tracks } = await createTestTrackPerformance()
      const activePerformance = initializeActivePerformance(performanceId.toString())
      activePerformance.trackMode = 'nonChoir'

      const track = tracks[0]
      const chunks = await readAndParseChunkFile(track)

      const wsClient1 = await createWebSocketClient(performanceId.toString())
      const wsClient2 = await createWebSocketClient(performanceId.toString(), 1)

      activePerformance.loadTrack(chunks!, track.mode, track.waveform, track.ttsRate)
      activePerformance.startSendingInterval(0, global.testWss, false, track._id.toString(), 0)

      jest.advanceTimersByTime(10000)
    })
  })
})
