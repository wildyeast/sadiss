import * as ws from "ws"

declare module 'ws' {
  export interface WebSocket extends ws {
    id: string,
    choirId: number,
    isAdmin: boolean
  }
}
