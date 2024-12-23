import fs from 'fs'
type File = Express.Multer.File
import { Frame, TrackDocument } from '../types'

export async function readAndParseChunkFile(track: TrackDocument) {
  try {
    const data = fs.readFileSync(`${process.env.CHUNKS_DIR}/${track.chunkFileName}`)
    const parsedData: Frame[] = JSON.parse(data.toString())
    return parsedData
  } catch (err) {
    console.error(err)
  }
}

export function getPartialFileByPrefix(files: File[], partialFilePrefix: string) {
  const partialFile = files.find((file) => file.originalname.startsWith(partialFilePrefix))
  if (partialFile) {
    const partialFileInfo = {
      origName: partialFile.originalname.replace(partialFilePrefix, '') + '.txt',
      fileName: partialFile.filename,
      path: partialFile.path
    }
    return partialFileInfo
  }
  return null
}
