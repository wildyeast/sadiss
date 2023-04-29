export interface Chunk {
  partials: Partial[]
  ttsInstruction: ClientTtsInstruction
}

export interface Partial {
  index: number
  startTime: number
  endTime: number
  breakpoints: Breakpoint[]
}

export interface PartialChunk {
  index: number
  startTime: number
  endTime: number
  breakpoints: Breakpoint[]
}

export interface Breakpoint {
  time: number
  freq: number
  amp: number
}

export interface OscillatorObject {
  index: number
  oscillator: OscillatorNode
  gain: GainNode
}

export interface TtsInstruction {
  startTime: number
  text: string
  voice: number
}

export type ClientTtsInstruction = Omit<TtsInstruction, 'voice'>

export interface AvailableLanguage {
  iso: string
  lang: string
}

export interface QrCodeScanResult {
  performanceName: string
  choirId?: number
  tts?: AvailableLanguage[]
  roleName?: string
  defaultLang?: string
  expertMode?: boolean
}
