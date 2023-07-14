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
  creator: { _id: string; username: string }
  isPublic: boolean
  tracks: Track[]
}

interface Track {
  _id: string
  name: string
  isPublic: boolean
  notes?: string
  mode: 'choir' | 'nonChoir'
  waveform: Waveform
  creator: { _id: string; username: string }
  ttsRate?: number
  partialFile?: { origName: string; fileName: string }
  ttsFiles?: TtsFileDownloadInformation[]
  trackPerformanceId: string
  sortOrder: number
}

interface TtsFileDownloadInformation {
  origName: string
  fileName: string
  lang: string
  voice: string
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

interface TrackPerformanceIdAndSortOrder {
  trackPerformanceId: string
  sortOrder: number
}

export type {
  QrCodeData,
  SadissPerformance,
  Track,
  Waveform,
  TtsFilesObject,
  TtsFileDownloadInformation,
  TrackPerformanceIdAndSortOrder
}
