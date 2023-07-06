// import * as ws from 'ws'
import { Types } from 'mongoose'
import WebSocketAlias from 'ws'

declare module 'ws' {
  export interface WebSocket extends WebSocketAlias {
    id: string // TODO: Should probably be Types.ObjectId
    choirId: number
    ttsLang: { iso: string; lang: string }
    isAdmin: boolean
    lastSentTime: number
    performanceId: Types.ObjectId
  }
}
