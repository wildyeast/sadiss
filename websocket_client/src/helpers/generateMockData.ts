import { PartialChunk, TtsInstruction, Chunk } from "../types/types"

export function generateChunks (secondsToGenerate: number) {
  let startTime = 0
  let ttsStartTime = 0
  const chunks = []
  for (let i = 0; i < secondsToGenerate; i++) {
    const breakpoints = []
    for (let j = 0; j < 10; j++) {
      breakpoints.push({
        time: startTime + 100 * j,
        freq: 300 + 10 * j,
        amp: 0.1
      })
    }
    chunks.push({
      partials: {
        index: 1,
        startTime: startTime,
        endTime: startTime + 999,
        breakpoints
      },
      ttsInstructions: {
        startTime: ttsStartTime + i,
        text: i.toString()
      }
    })
    startTime += 1000
    ttsStartTime += 1000
  }
  return chunks
}

const example: Chunk = {
  partials: [
    {
      index: 1,
      startTime: 0,
      endTime: 999,
      breakpoints: [
        {
          time: 0,
          freq: 300,
          amp: 0.1
        }
      ]
    }
  ],
  ttsInstruction: {
    startTime: 0,
    text: 'Zero'
  }
}

// OLD //

// export function generateMockPartialData (partialIndex: number, countOfChunksToGenerate: number) {
//   const chunks: PartialChunk[] = []
//   const partialEndTime = (1000 + countOfChunksToGenerate - 1) * 1000
//   for (let i = 0; i < countOfChunksToGenerate; i++) {
//     const mockedBreakpoints = []
//     for (let j = 0; j < 100; j++) {
//       mockedBreakpoints.push({
//         time: j * 10 * i,
//         freq: 400 + j,
//         amp: 0.1
//       })
//     }
//     chunks.push({
//       index: partialIndex,
//       startTime: i * 1000,
//       endTime: 1000 + i * 1000,
//       partialEndTime,
//       breakpoints: mockedBreakpoints
//     })
//   }
//   console.log('Generated track: ', chunks)
//   return chunks
// }

// export function generateBeep (allBeepsSamePartialId = false) {
//   const VOICE_COUNT = 1
//   const BEEP_COUNT = 10
//   const BEEP_LENGTH = 100 // ms

//   const track: PartialChunk[][] = []
//   for (let i = 1; i <= VOICE_COUNT; i++) {
//     const voice: PartialChunk[] = []
//     for (let j = 0; j < BEEP_COUNT; j++) {
//       voice.push({
//         index: allBeepsSamePartialId ? i : j,
//         startTime: j * 1000,
//         endTime: (BEEP_LENGTH + j * 1000) - 1,
//         partialEndTime: (BEEP_LENGTH + j * 1000) - 1,
//         breakpoints: [
//           {
//             time: j * 1000,
//             freq: 200 * i,
//             amp: 0.1
//           }
//         ]
//       })
//     }
//     track.push(voice)
//   }
//   console.log('Generated track: ', track)
//   return track
// }

// /** 
// * @return Returns one long partial per voice. The partial is split up into chunks
// */
// export function generateSplitPartial () {
//   const VOICE_COUNT = 1
//   const TRACK_LENGTH = 10
//   const CHUNK_LENGTH = 1

//   const track: PartialChunk[][] = []
//   for (let i = 1; i <= VOICE_COUNT; i++) {
//     const voice: PartialChunk[] = []
//     const partialEndTime = ((CHUNK_LENGTH + TRACK_LENGTH - 1) * 1000) - 1
//     for (let j = 0; j < TRACK_LENGTH; j++) {
//       voice.push({
//         index: i,
//         startTime: j * CHUNK_LENGTH * 1000,
//         endTime: ((CHUNK_LENGTH + j) * 1000) - 1,
//         partialEndTime,
//         breakpoints: [
//           {
//             time: j * 1000,
//             freq: i * 200,
//             amp: 0.1
//           }
//         ]
//       })
//     }
//     track.push(voice)
//   }
//   console.log('Generated track: ', track)
//   return track
// }

// export function generateChoirTTS () {
//   const VOICE_COUNT = 4
//   const tts: TtsInstruction[][] = Array.from({ length: VOICE_COUNT }, () => [])
//   for (let i = 0; i < 20; i++) {
//     tts[i % VOICE_COUNT].push({
//       startTime: i + 1,
//       voice: i % VOICE_COUNT + 1,
//       text: (i % VOICE_COUNT + 1).toString()
//     })
//   }

//   console.log('Generated TTS: ', tts)
//   return tts
// }
