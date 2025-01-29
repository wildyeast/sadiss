import { TtsJson } from '../types'
import { logger } from './logger'
import fs from 'fs'

export const convertSrtToJson = (srtFiles: { path: string; originalname: string }[]) => {
  let ttsJson: TtsJson = {}
  const ttsLangs = new Set<string>()
  const TIMESTAMP_DELIMITER = ' --> '

  for (const file of srtFiles) {
    const data = fs.readFileSync(file.path, 'utf-8')
    const lines = data.split('\n')

    const [_, voice, lang] = file.originalname.split('_')
    ttsLangs.add(lang)

    let lastLineWasTimestamp = false
    let currentTimestamp = -1
    let currentLine = ''

    for (let line of lines) {
      line = line.trim()

      if (!line) {
        const currentLineWithoutHtmlTags = removeHtmlTags(currentLine)
        ttsJson = writeToObject(ttsJson, currentTimestamp, voice, lang, currentLineWithoutHtmlTags)
        currentLine = ''
        currentTimestamp = -1
        lastLineWasTimestamp = false
      } else if (lastLineWasTimestamp) {
        if (currentLine) {
          currentLine += ' ' + line
        } else {
          currentLine = line
        }
      } else if (line.includes(TIMESTAMP_DELIMITER)) {
        const [start, _] = line.split(TIMESTAMP_DELIMITER)
        currentTimestamp = convertTimestampToSeconds(start)
        lastLineWasTimestamp = true
      }
    }

    // Write last timestamp and its lines to object
    ttsJson = writeToObject(ttsJson, currentTimestamp, voice, lang, currentLine)
  }
  // logger.debug(`Converted .srt to following object: ${ttsJson}`)
  return { ttsLangs, ttsJson }
}

/**
 * Converts string of format 'hours:minutes:seconds,milliseconds' to the total number of seconds.
 */
const convertTimestampToSeconds = (timestamp: string) => {
  const time = timestamp.split(':')
  return +time[0] * 3600 + +time[1] * 60 + +time[2].replace(',', '.')
}

/**
 * Writes the current line of text to the TtsJson object at the specified timestamp, voice, and language.
 * @param result - The TtsJson object to write to.
 * @param currentTimestamp - The timestamp at which to write the line of text.
 * @param voice - The voice associated with the line of text.
 * @param lang - The language associated with the line of text.
 * @param currentLine - The line of text to write.
 * @returns The updated TtsJson object.
 */

const writeToObject = (result: TtsJson, currentTimestamp: number, voice: string, lang: string, currentLine: string) => {
  if (currentTimestamp < 0) return result
  if (!result[currentTimestamp]) {
    result[currentTimestamp] = {}
  }
  if (!result[currentTimestamp][voice]) {
    result[currentTimestamp][voice] = {}
  }
  result[currentTimestamp][voice][lang] = currentLine
  return result

  // Same as above
  // More concise, but still pretty hard to understand
  // result[currentTimestamp] = {
  //   ...result[currentTimestamp],
  //   [voice]: {
  //     ...(result[currentTimestamp]?.[voice] || {}),
  //     [lang]: currentLine
  //   }
  // }
  // End of equivalent code as above
}

/**
 * Removes HTML tags from the input string.
 *
 * @param input - The string containing HTML tags.
 * @returns The input string with all HTML tags removed.
 */
function removeHtmlTags(input: string): string {
  // This regex finds all HTML tags and replaces them with an empty string
  return input.replace(/<[^>]*>/g, '')
}
