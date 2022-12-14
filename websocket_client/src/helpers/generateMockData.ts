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
