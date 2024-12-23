export interface TtsInstructions {
  [voice: string]: { time: string; langs: { [language: string]: string } }
}
