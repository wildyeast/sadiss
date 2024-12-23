export interface TtsJson {
  [timestamp: number]: {
    [voice: string]: {
      [language: string]: string
    }
  }
}
