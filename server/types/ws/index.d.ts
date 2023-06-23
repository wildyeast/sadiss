// import * as ws from 'ws'
import WebSocketAlias from 'ws'

declare module 'ws' {
  export interface WebSocket extends WebSocketAlias {
    id: string
    choirId: number
    ttsLang: { iso: string; lang: string }
    isAdmin: boolean
    lastSentTime: number
    performanceId: string
  }
}
