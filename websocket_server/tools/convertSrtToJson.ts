import { TtsJson } from "../types/types"

const fs = require('fs')

export const convertSrtToJson = (srtFiles: { path: string, originalname: string }[]) => {
  const result: TtsJson = {}

  for (const file of srtFiles) {
    const data = fs.readFileSync(file.path, 'utf-8')
    const lines = data.split('\n')

    const [_, voice, lang] = file.originalname.split('_')

    let lastLineWasTimestamp = false
    let currentTimestamp = -1
    let currentLine = ''

    for (const line of lines) {
      const timestampDelimiter = ' --> '

      if (!line) {
        // if (!result[currentTimestamp]) {
        //   result[currentTimestamp] = {}
        // }
        // if (!result[currentTimestamp][voice]) {
        //   result[currentTimestamp][voice] = {}
        // }
        // if (result[currentTimestamp][voice][lang]) {
        //   result[currentTimestamp][voice][lang] = ' ' + currentLine
        // } else {
        //   result[currentTimestamp][voice][lang] = currentLine
        // }

        // Same as what is commented above
        // More concise, but still pretty hard to understand
        result[currentTimestamp] = {
          ...result[currentTimestamp],
          [voice]: {
            ...(result[currentTimestamp]?.[voice] || {}),
            [lang]: currentLine
          }
        }
        // End of equivalent code to commented above

        currentLine = ''
        lastLineWasTimestamp = false
      } else if (lastLineWasTimestamp) {
        currentLine += line
      }
      else if (line.includes(timestampDelimiter)) {
        const [start, _] = line.split(timestampDelimiter)
        currentTimestamp = convertTimestampToSeconds(start)
        lastLineWasTimestamp = true
      }
    }
  }
  console.log('Converted .srt to following JSON: ', result)
  return result
}

/** 
* Converts string of format 'hours:minutes:seconds,milliseconds' to the total number of seconds.
*/
const convertTimestampToSeconds = (timestamp: string) => {
  const time = timestamp.split(':')
  return +time[0] * 3600 + +time[1] * 60 + +time[2].replace(',', '.');
}
