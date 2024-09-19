import { TtsFileDownloadInformation, Waveform } from "."

export default interface Track {
  _id: string
  name: string
  isPublic: boolean
  notes?: string
  mode: "choir" | "nonChoir"
  waveform: Waveform
  creator: { _id: string; username: string }
  ttsRate?: number
  partialFile?: { origName: string; fileName: string }
  ttsFiles?: TtsFileDownloadInformation[]
  trackPerformanceId: string
  sortOrder: number
}
