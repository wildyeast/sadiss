export interface PartialChunk {
  index: number,
  startTime: number,
  endTime: number,
  breakpoints: Breakpoint[]
}

export interface Breakpoint {
  time: number,
  freq: number,
  amp: number
}

export type WebSocketWithId = {
  id: number
} & WebSocket

export type Message = {
  message?: string,
  [key: string]: any
}
