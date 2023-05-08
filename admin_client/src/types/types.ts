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
}

export type { QrCodeData, SadissPerformance }
