export interface PartialChunk {
  index: number,
  startTime: number,
  endTime: number,
  partialEndTime: number,
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
