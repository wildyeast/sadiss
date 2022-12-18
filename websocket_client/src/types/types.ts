export interface PartialChunk {
  index: number,
  startTime: number,
  endTime: number,
  partialEndTime: number, // End time of the partial this chunk is from
  breakpoints: Breakpoint[]
}

export interface Breakpoint {
  time: number,
  freq: number,
  amp: number
}

export interface OscillatorObject {
  index: number,
  oscillator: OscillatorNode,
  gain: GainNode
}
