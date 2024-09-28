export default interface StoreTrack {
  name: string
  partialFile: File | null
  isChoir: boolean
  ttsFiles: Record<number, Record<string, File>>
  notes: string
  waveform: string
  ttsRate: number
  isPublic: boolean
}
