import fs from 'fs'
import { Frame, TrackDocument } from '../types/types'

async function readAndParseChunkFile(track: TrackDocument) {
  try {
    const data = fs.readFileSync(`${process.env.CHUNKS_DIR}/${track.chunkFileName}`)
    const parsedData: Frame[] = JSON.parse(data.toString())
    return parsedData
  } catch (err) {
    console.error(err)
  }
}

export { readAndParseChunkFile }
