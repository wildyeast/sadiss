import { Server, ServerOptions, WebSocket } from 'ws'
import { Types } from 'mongoose'

export class SadissWebSocket extends WebSocket {
  id = ''
  choirId = -1
  ttsLang = { iso: '', lang: '' }
  isAdmin = false
  lastSentTime = 1
  performanceId = new Types.ObjectId()
}

export class SadissWebSocketServer extends Server<SadissWebSocket> {
  constructor(options: ServerOptions) {
    super({
      ...options,
      WebSocket: SadissWebSocket
    })
  }
  clients: Set<SadissWebSocket> = new Set()
}
