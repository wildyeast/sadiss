import { createLogger, format, transports } from 'winston'
const { combine, timestamp, printf, colorize } = format

const myFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} ${level}: ${message}`
})

let desiredLogLevel = 'info'
if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
  desiredLogLevel = 'debug'
}

export const logger = createLogger({
  level: desiredLogLevel,
  format: combine(timestamp(), colorize(), myFormat),
  transports: [new transports.Console()]
})
