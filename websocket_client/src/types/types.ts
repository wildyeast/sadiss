export interface PartialChunk {
  index: string,
  startTime: number,
  endTime: number,
  breakpoints: {
    time: number,
    freq: number,
    amp: number
  }[]
}
