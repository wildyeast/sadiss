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
  id: string
  email: string
}

export interface TrackDocument extends Document {
  name: string
  chunks: string
  chunkFileName: string
  partialsCount: number
  mode: string
  notes: string
  ttsInstructions: string
  ttsLangs: string[]
  waveform: string
  ttsRate: string
  partialFile: object
  ttsFiles: TTSFileObject[]
  isPublic: boolean
  userId: string
}

export interface TTSFileObject {
  [voice: number]: { [lang: string]: File }
}

export interface SadissPerformanceDocument extends Document {
  name: string
  userId: string
  isPublic: boolean
}

export interface TrackPerformanceDocument extends Document {
  trackId: TrackDocument
  performanceId: SadissPerformanceDocument
}
