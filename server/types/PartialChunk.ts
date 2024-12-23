import { Breakpoint } from './Breakpoint'

export interface PartialChunk {
  index: number
  startTime: number
  endTime: number
  breakpoints: Breakpoint[]
}
