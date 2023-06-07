import { PartialChunk, TtsJson } from '../types/types'

const fs = require('fs')
const readline = require('readline')

/** Takes partial path and returns chunk array */
export const chunk = async (path?: string, ttsInstructions?: TtsJson) => {
  const CHUNK_DURATION = 0.999 // float in seconds

  // Initialize chunks array and first chunk object
  const chunks = []
  const initChunk = () => {
    return {
      time: 0,
      partials: <PartialChunk[]>[],
      ttsInstructions: <{ [voice: string]: { [language: string]: string } }>{}
    }
  }
  let chunk = initChunk()
  chunk.time = 0

  let partialsCount = -1

  if (path) {
    // Open partials file
    console.log('Analyzing', path, '...')
    const fileStream = fs.createReadStream(path)
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    })
    let frameCount = 0

    // Read each line
    for await (const line of rl) {
      const f = line.split(' ')

      // Handle first few lines
      if (partialsCount < 0 && f[0] === 'partials-count') {
        partialsCount = +f[1]
      } else if (!frameCount && f[0] === 'frame-count') {
        frameCount = f[1]
        continue
      } else if (!frameCount || f[0] === 'frame-data') {
        continue
      }

      // Handle frame data
      const time = parseFloat(parseFloat(f[0]).toFixed(2))
      if (chunk.time == null) {
        chunk.time = time
      }
      // Create new chunk if chunk time exceeded
      if (time >= chunk.time + CHUNK_DURATION) {
        chunks.push(chunk)
        chunk = initChunk()
        chunk.time = time
      }

      // Read each triple of frame data
      for (let i = 2; i <= f.length - 2; i += 3) {
        const index = +f[i]
        const freq = f[i + 1]
        const amp = f[i + 2]

        // Find partial if it exists in chunk array
        let partial = chunk.partials.find((p) => p.index === index)
        if (!partial) {
          // init if it doesn't
          partial = {
            index,
            startTime: time,
            endTime: time + CHUNK_DURATION,
            breakpoints: []
          }
          chunk.partials.push(partial)
        }

        partial.breakpoints.push({
          time,
          freq,
          amp
        })
      }
    }
    chunks.push(chunk)
  }

  // Insert TTS data into chunks
  if (ttsInstructions) {
    for (const ttsTime in ttsInstructions) {
      // Need to floor time, meaning tts time of e.g. 11.42 will be assigned to chunk index 11.
      const flooredTime = Math.floor(+ttsTime)
      if (chunks[flooredTime]) {
        if (chunks[flooredTime].ttsInstructions) {
          chunks[flooredTime].ttsInstructions = { ...chunks[flooredTime].ttsInstructions, ...ttsInstructions[ttsTime] }
        } else {
          chunks[flooredTime].ttsInstructions = ttsInstructions[ttsTime]
        }
      } else {
        const chunk = initChunk()
        chunk.ttsInstructions = ttsInstructions[ttsTime]
        chunks[flooredTime] = chunk
      }
    }
  }

  return { partialsCount, chunks }
}
