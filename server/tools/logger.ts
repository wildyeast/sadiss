import { createLogger, format, transports } from 'winston'
const { combine, timestamp, printf, colorize } = format

const myFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} ${level}: ${message}`
})

export const logger = createLogger({
  level: process.env.NODE_ENV === 'test' ? 'debug' : 'info',
  format: combine(timestamp(), colorize(), myFormat),
  transports: [new transports.Console()]
})
