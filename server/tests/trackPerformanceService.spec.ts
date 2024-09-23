import { InvalidInputError } from '../errors'
import { TrackPerformance } from '../models'
import { setStartTime } from '../services/trackPerformanceService'
import { createTestPerformance, createTestTrack, createTestTrackPerformance } from './testUtils'

describe('trackPerformanceService test', () => {
  describe('setStartTime function', () => {
    it('should set the startTime of the TrackPerformance to the provided value and return the updated TrackPerformance', async () => {
      const { trackPerformances } = await createTestTrackPerformance()
      const { _id: trackPerformanceId } = trackPerformances[0]

      const startTime = 123
      const returnedUpdatedTrackPerformance = await setStartTime(trackPerformanceId, startTime)

      const updatedTrackPerformance = await TrackPerformance.findById(trackPerformanceId)
      expect(updatedTrackPerformance!.startTime).toBe(startTime)
      expect(returnedUpdatedTrackPerformance!._id.toString()).toBe(trackPerformanceId)
    })
  })

  it('throws an InvalidInputError if the provided startTime is less than 0 and does not set it', async () => {
    const { trackPerformances } = await createTestTrackPerformance()
    const { _id: trackPerformanceId } = trackPerformances[0]

    const startTime = -1
    try {
      await setStartTime(trackPerformanceId, startTime)
    } catch (error: any) {
      expect(error).toBeInstanceOf(InvalidInputError)
    }

    const updatedTrackPerformance = await TrackPerformance.findById(trackPerformanceId)
    expect(updatedTrackPerformance!.startTime).toBe(0)
  })
})
