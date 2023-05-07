import * as ws from 'ws'

declare module 'ws' {
  export interface WebSocket extends ws {
    id: string
    choirId: number
    ttsLang: { iso: string; lang: string }
    isAdmin: boolean
    lastSentTime: number
    performanceId: string
  }
}
