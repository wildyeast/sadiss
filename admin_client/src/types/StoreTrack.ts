export default interface StoreTrack {
  name: string
  partialFile: File | null
  mode: "choir" | "nonChoir"
  ttsFiles: Record<number, Record<string, File>>
  notes: string
  waveform: string
  ttsRate: number
  isPublic: boolean
}
