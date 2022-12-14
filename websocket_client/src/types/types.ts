export interface PartialChunk {
  index: number,
  startTime: number,
  endTime: number,
  breakpoints: {
    time: number,
    freq: number,
    amp: number
  }[]
}

export interface OscillatorObject {
  index: number,
  oscillator: OscillatorNode
}
