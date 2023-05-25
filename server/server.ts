// Code in part taken from https://www.pubnub.com/blog/nodejs-websocket-programming-examples/
import express from 'express'
import { Message } from './types/types'
import * as dotenv from 'dotenv'
import { passport } from './auth'
import { Server } from 'ws'
import { connectDB } from './database'
import { startKeepAliveInterval } from './tools/startKeepAliveInterval'
import { ActivePerformance } from './activePerformance'

const cors = require('cors')
const uuid = require('uuid')
const session = require('express-session')

const p = new ActivePerformance(1)
// Load .env
dotenv.config()

// Connect to database
if (process.env.NODE_ENV !== 'test') {
  connectDB()
}

const BASE_URL = '127.0.0.1'
const BASE_PORT = 3005

const whitelist = [
  `http://${BASE_URL}:${BASE_PORT}`,
  'http://127.0.0.1:5173',
  'http://localhost:5173',
  'http://localhost:8081',
  'http://localhost:8080',
  'https://sadiss.net' /** other domains if any */
]
const corsOptions = {
  origin: (origin: string, callback: Function) => {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS.'))
    }
  }
}

const app = express()
  .use(express.json())
  .use(cors(corsOptions))
  .use(express.urlencoded({ extended: false }))
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
  wss = new Server({ port: 0 })
  server = app.listen()
} else {
  wss = new Server({ port: +process.env.WS_SERVER_PORT! })
  console.log(`Websocket server listening on port ${process.env.WS_SERVER_PORT}.`)
  server = app.listen(BASE_PORT, () => console.log(`Http server listening on port ${BASE_PORT}.`))
}

startKeepAliveInterval(wss)
wss.on('connection', (client) => {
  // Assign id to new connection, needed for nonChoir partial distribution
  client.id = uuid.v4()
  console.log('New client connected! Assigned id: ', client.id, 'Total clients:', wss.clients.size)

  client.onclose = () => console.log('Client has disconnected!')

  client.onmessage = (event) => {
    const parsed: Message = JSON.parse(event.data.toString())
    console.log('Received message from ws client:', parsed.message)
    if (parsed.message === 'clientInfo') {
      client.choirId = parsed.clientId
      client.ttsLang = parsed.ttsLang
      client.performanceId = parsed.performanceId
      console.log(
        `Performance ${client.performanceId}: Client ${client.id} registered with choir id ${client.choirId} and TTS lang ${client.ttsLang}`
      )
    } else if (parsed.message === 'measure') {
      client.send('measure')
    } else if (parsed.message === 'isAdmin') {
      client.isAdmin = true
      if (parsed.performanceId) {
        client.performanceId = parsed.performanceId
        console.log(`Performance ${client.performanceId}: Client ${client.id} is admin`)
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
app.use('/', routes)
app.use((req, res) => res.status(404))

module.exports = { app, server, wss }
