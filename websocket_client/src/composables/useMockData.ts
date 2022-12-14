import { ref } from "vue"
import { PartialChunk } from "../types/types"

export function useMockData (countsOfChunksToGenerate: number) {
  const chunks = ref<PartialChunk[]>([])
  for (let i = 0; i < countsOfChunksToGenerate; i++) {
    const mockedBreakpoints = []
    for (let j = 0; j < 100; j++) {
      mockedBreakpoints.push({
        time: j * 10 * i,
        freq: 400 + j,
        amp: 1
      })
    }
    chunks.value.push({
      index: '1',
      startTime: i * 1000,
      endTime: 1000 + i * 1000,
      breakpoints: mockedBreakpoints
    })
  }

  return { chunks }
}
