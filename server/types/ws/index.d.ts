// import * as ws from 'ws'
import { Types } from 'mongoose'

declare module 'ws' {
  export interface WebSocket {
    id: string // TODO: Should probably be Types.ObjectId
    choirId: number
    ttsLang: { iso: string; lang: string }
    isAdmin: boolean
    lastSentTime: number
    performanceId: Types.ObjectId
  }
}
