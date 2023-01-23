export interface PartialChunk {
  index: number,
  startTime: number,
  endTime: number,
  breakpoints: Breakpoint[]
}

export interface Breakpoint {
  time: number,
  freq: number,
  amp: number
}

export type Message = { [key: string]: any }

export interface TtsInstruction {
  startTime: number,
  voice?: number,
  text: string
}

export interface TtsJson {
  [timestamp: number]: {
    [voice: string]: {
      [language: string]: string
    }
  }
}

export type Mode = 'choir' | 'nonChoir'

