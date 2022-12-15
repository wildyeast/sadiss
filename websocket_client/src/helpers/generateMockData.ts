import { PartialChunk } from "../types/types"

export function generateMockPartialData (partialIndex: number, countOfChunksToGenerate: number) {
  const chunks: PartialChunk[] = []
  for (let i = 0; i < countOfChunksToGenerate; i++) {
    const mockedBreakpoints = []
    for (let j = 0; j < 100; j++) {
      mockedBreakpoints.push({
        time: j * 10 * i,
        freq: 400 + j,
        amp: 1
      })
    }
    chunks.push({
      index: partialIndex,
      startTime: i * 1000,
      endTime: 1000 + i * 1000,
      breakpoints: mockedBreakpoints
    })
  }

  return chunks
}

export function generateBeep () {
  const VOICE_COUNT = 2
  const BEEP_COUNT = 10
  const BEEP_LENGTH = 250 // ms

  const track: PartialChunk[][] = []
  for (let i = 0; i <= VOICE_COUNT; i++) {
    const voice: PartialChunk[] = []
    for (let j = 0; j <= BEEP_COUNT; j++) {
      voice.push({
        index: i,
        startTime: i * 1000,
        endTime: BEEP_LENGTH + i * 1000,
        breakpoints: [
          {
            time: i * 1000,
            freq: 200 * i,
            amp: 1
          }
        ]
      })
      track.push(voice)
    }
  }
  return track
}
