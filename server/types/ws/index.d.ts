import * as ws from 'ws'

declare module 'ws' {
  export interface WebSocket extends ws {
    id: string
    choirId: number
    ttsLang: string
    isAdmin: boolean
    lastSentTime: number
  }
}
