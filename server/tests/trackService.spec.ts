import { getTrackDataForDownload } from '../services/trackService'
import { createTestTrack } from './testUtils'

describe('trackService', () => {
  it('should return a track with the correct fields for download', async () => {
    const track = await createTestTrack()

    const result = await getTrackDataForDownload(track._id)

    expect(result.toObject()).toMatchObject({
      name: track.name,
      mode: track.mode,
      notes: track.notes,
      ttsLangs: track.ttsLangs,
      waveform: track.waveform,
      ttsRate: track.ttsRate,
      ttsFiles: track.ttsFiles,
      partialFile: track.partialFile,
      isPublic: track.isPublic,
      creator: track.creator.toString()
    })
  })
})
