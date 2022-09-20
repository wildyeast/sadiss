export interface OscObj {
  oscNode: OscillatorNode,
  gainNode: GainNode,
}

export interface SequencerTtsInstructions {
  [timestamp: number]: {
    [languageCode: string]: string
  }
}

export interface ChoirTtsInstructions {
  _config?: {
    rate?: number
  },
  [timestamp: number]: {
    [partialId: number]: {
      [languageCode: string]: string
    }
  }
}
