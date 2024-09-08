// Code in part taken from https://www.pubnub.com/blog/nodejs-websocket-programming-examples/
import express from 'express'
import { Message } from './types/types'
import * as dotenv from 'dotenv'
import { passport } from './auth'
import { Server } from 'ws'
import { connectDB } from './database'
import { startKeepAliveInterval } from './tools/startKeepAliveInterval'
import { startWebSocketServer } from './services/webSocketServerService'
import fs from 'fs'
import { logger } from './tools'
import { errorHandler } from './middlewares/errorHandler'

const cors = require('cors')
const uuid = require('uuid')
const session = require('express-session')
const cookieParser = require('cookie-parser')

// Connect to database
if (process.env.NODE_ENV !== 'test') {
  // Load .env
  dotenv.config()
  connectDB()
} else {
  // Load .env.test
  dotenv.config({ path: '.env.test' })
}

if (!fs.existsSync(process.env.CHUNKS_DIR!)) {
  fs.mkdirSync(process.env.CHUNKS_DIR!)
  console.log('Directory created: ', process.env.CHUNKS_DIR)
}

let whitelist = ['https://sadiss.net']

if (process.env.NODE_ENV === 'development') {
  whitelist = whitelist.concat([
    'http://127.0.0.1:5173',
    'http://localhost:5173',
    'http://localhost:8081',
    'http://localhost:8080'
  ])
}

const corsOptions = {
  origin: (origin: string, callback: Function) => {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS.'))
    }
  },
  credentials: true
}

const app = express()
  .use(express.json())
  .use(cors(corsOptions))
  .use(express.urlencoded({ extended: false }))
  .use(cookieParser())
  // Initialize express-session middleware
  .use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false
    })
  )
  // Initialize Passport and restore authentication state, if any, from the session.
  .use(passport.initialize())
  .use(passport.session())

// WEBSOCKETS //
let server
let wss: Server
if (process.env.NODE_ENV === 'test') {
  wss = startWebSocketServer()
  server = app.listen()
} else {
  wss = startWebSocketServer(+process.env.WS_SERVER_PORT!)
  logger.info(`Websocket server listening on port ${process.env.WS_SERVER_PORT}.`)

  server = app.listen(process.env.BASE_PORT, () => logger.info(`Http server listening on port ${process.env.BASE_PORT}.`))
}

startKeepAliveInterval(wss)
wss.on('connection', (client) => {
  // Assign id to new connection, needed for nonChoir partial distribution
  client.id = uuid.v4()
  logger.info(`New client connected! Assigned id: ${client.id} Total clients: ${wss.clients.size}`)

  client.onclose = () => logger.info(`Client ${client.id} has disconnected!`)

  client.onmessage = (event) => {
    const parsed: Message = JSON.parse(event.data.toString())
    logger.debug(`Received message from ws client: ${parsed.message}`)
    if (parsed.message === 'clientInfo') {
      client.choirId = parsed.clientId
      client.ttsLang = parsed.ttsLang
      client.performanceId = parsed.performanceId
      logger.info(
        `Performance ${client.performanceId}: Client ${client.id} registered with choir id ${client.choirId} and TTS lang ${client.ttsLang.iso}`
      )
      client.send('clientInfoReceived')
    } else if (parsed.message === 'measure') {
      client.send('measure')
    } else if (parsed.message === 'isAdmin') {
      client.isAdmin = true
      if (parsed.performanceId) {
        client.performanceId = parsed.performanceId
        logger.info(`Performance ${client.performanceId}: Client ${client.id} is admin`)
      }
    }
  }
})

const routes = require('./routes/routes')

// Inject wss into request
app.use((req, res, next) => {
  req.wss = wss
  next()
})
app.use('/', routes).use(errorHandler)
app.use((req, res) => res.status(404))

module.exports = { app, server, wss }
