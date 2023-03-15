export interface PartialChunk {
  index: number
  startTime: number
  endTime: number
  breakpoints: Breakpoint[]
}

export interface Breakpoint {
  time: number
  freq: number
  amp: number
}

export type Message = { [key: string]: any }

export interface TtsJson {
  [timestamp: number]: {
    [voice: string]: {
      [language: string]: string
    }
  }
}

export type Mode = 'choir' | 'nonChoir'

export interface UserDocument extends Document {
  username: string
  password: string
}
