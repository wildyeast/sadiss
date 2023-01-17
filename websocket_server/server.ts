// Code in part taken from https://www.pubnub.com/blog/nodejs-websocket-programming-examples/

// HTTP SERVER //
import express from 'express'
import { PartialChunk, SadissWebSocket, Message, TtsInstruction, Mode } from './types/types'
import * as dotenv from 'dotenv'

const cors = require('cors')
const router = express.Router()
const mongoose = require('mongoose')
const uuid = require('uuid')

// Load .env
dotenv.config()

// Connect to database
//const mongoURI = 'mongodb://sadiss.net:27017/sadiss'
const mongoHost = process.env.MONGO_HOST
const mongoUser = process.env.MONGO_USER
const mongoPW = process.env.MONGO_PW
const mongoDbName = process.env.MONGO_DB_NAME
const mongoURI = `mongodb://${mongoUser}:${mongoPW}@${mongoHost}/${mongoDbName}?directConnection=true&serverSelectionTimeoutMS=2000`
mongoose.connect(mongoURI)

const BASE_URL = '127.0.0.1'
const BASE_PORT = 3005

const whitelist = [`http://${BASE_URL}:${BASE_PORT}`, 'http://127.0.0.1:5173' /** other domains if any */]
const corsOptions = {
  origin: (origin: string, callback: Function) => {
    if (whitelist.indexOf(origin) !== -1) {
      // TODO: Find out what exactly the following line does. Code is copy/pasted.
      // Read this https://www.npmjs.com/package/cors#configuring-cors-asynchronously
      // and this https://stackoverflow.com/questions/72287773/do-not-understand-the-function-with-express-and-cors
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}

const app = express()
  .use(express.json())
  // .use(cors(corsOptions))
  .use(express.urlencoded({ extended: false }))

app.listen(BASE_PORT, () => console.log(`Http server listening on port ${BASE_PORT}.`))

// WEBSOCKETS //
const { Server } = require('ws')

const wss = new Server({ port: process.env.WS_SERVER_PORT })
console.log(`Websocket server listening on port ${process.env.WS_SERVER_PORT}.`)
wss.on('connection', (client: SadissWebSocket) => {
  // Assign id to new connection, needed for nonChoir partial distribution
  client.id = uuid.v4()
  console.log('New client connected! Assigned id: ', client.id)

  client.onclose = () => console.log('Client has disconnected!')

  client.onmessage = (event: MessageEvent<string>) => {
    const parsed: Message = JSON.parse(event.data)
    if (parsed.message === 'clientId') {
      client.choirId = parsed.clientId
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

