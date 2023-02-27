interface QrCodeData {
  choirId?: number
  roleName?: string
  tts?: { iso: string; lang: string | undefined }[]
  defaultLang?: string
  performanceName: string
  expertMode: boolean
}
