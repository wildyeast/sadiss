interface QrCodeData {
  choirId?: string
  roleName?: string
  tts?: { iso: string; lang: string | undefined }[]
  defaultLang?: string
  performanceName: string
  expertMode: boolean
  performanceId: string
  wsUrl: string
}

interface SadissPerformance {
  _id: string
  name: string
  username: string
  isPublic: boolean
  tracks: Track[]
}

interface Track {
  _id: string
  name: string
  username: string
  isPublic: boolean
  notes?: string
  mode: 'choir' | 'nonChoir'
  waveform: Waveform
  ttsRate?: number
  partialFile?: string
  ttsFiles?: { origName: string; fileName: string }[]
}

// type UploadTrack = {
//   numberOfVoices?: number
//   ttsLanguages?: string
//   partialFile?: File
//   ttsFiles?: TtsFilesObject
// } & Track

type Waveform = 'sine' | 'square' | 'sawtooth' | 'triangle'

interface TtsFilesObject {
  [voice: number]: { [lang: string]: File }
}

export type { QrCodeData, SadissPerformance, Track, Waveform, TtsFilesObject }
