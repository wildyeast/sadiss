export default interface QrCodeData {
  choirId?: string
  roleName?: string
  tts?: { iso: string; lang: string | undefined }[]
  defaultLang?: string
  performanceName: string
  expertMode: boolean
  performanceId: string
  wsUrl: string
}
