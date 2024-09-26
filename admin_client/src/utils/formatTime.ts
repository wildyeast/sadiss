/**
 * Takes a number of chunks and returns a string in the format "mm.ss". Assumes that each chunk is 1 second.
 * @param chunks - The number of chunks to format.
 * @return The formatted time.
 */
export function formatTime(chunks: number) {
  const padWithZero = (num: number) => num.toString().padStart(2, "0")

  const minutes = Math.floor(chunks / 60)
  const seconds = chunks % 60
  return `${padWithZero(minutes)}.${padWithZero(seconds)}`
}

export function formattedTimeToChunks(formattedTime: string) {
  const [minutes, seconds] = formattedTime.split(".").map(Number)
  return minutes * 60 + seconds
}
