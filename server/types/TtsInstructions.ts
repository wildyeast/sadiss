export interface TtsInstructions {
  [voice: string]: { time: number; langs: { [language: string]: string } }
}
