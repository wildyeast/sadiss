interface QrCodeData {
  choirId?: number
  tts?: { iso: string; lang: string | undefined }[]
  defaultLang?: string
  performanceName: string
  expertMode: boolean
}
