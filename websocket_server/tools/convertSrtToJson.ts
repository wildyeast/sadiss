const fs = require('fs')

export const convertSrtToJson = (srtFiles: { path: string, originalname: string }[]) => {
  const result: { [timestamp: number]: { [voice: number | string]: { [language: string]: string } } } = {}

  for (const file of srtFiles) {
    const data = fs.readFileSync(file.path, 'utf-8')
    const lines = data.split('\n')

    const [_, voice, lang] = file.originalname.split('_')

    let lastLineWasTimestamp = false
    let currentTimestamp: number = -1

    for (const line of lines) {
      const timestampDelimiter = ' --> '

      if (lastLineWasTimestamp) {
        if (!result[currentTimestamp]) {
          result[currentTimestamp] = {}
        }
        if (!result[currentTimestamp][voice]) {
          result[currentTimestamp][voice] = {}
        }
        result[currentTimestamp][voice][lang] = line
        lastLineWasTimestamp = false
      }
      else if (line.includes(timestampDelimiter)) {
        const [start, _] = line.split(timestampDelimiter)
        currentTimestamp = convertTimestampToSeconds(start)
        lastLineWasTimestamp = true
      }
    }
  }
  return result
}

/** 
* Converts string of format 'hours:minutes:seconds,milliseconds' to the total number of seconds.
*/
const convertTimestampToSeconds = (timestamp: string) => {
  const time = timestamp.split(':')
  return +time[0] * 3600 + +time[1] * 60 + +time[2].replace(',', '.');
}
