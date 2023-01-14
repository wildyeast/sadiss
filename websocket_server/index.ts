// Code in part taken from https://www.pubnub.com/blog/nodejs-websocket-programming-examples/

// HTTP SERVER //
import express from 'express'
import { PartialChunk, SadissWebSocket, Message, TtsInstruction, Mode } from './types/types'
import * as dotenv from 'dotenv'

const cors = require('cors')
const router = express.Router()
const fs = require('fs')
const readline = require('readline')
const mongoose = require('mongoose')

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

// Define track schema for db
const trackSchema = new mongoose.Schema({
  name: String,
  chunks: String,
  notes: String
})
trackSchema.set('timestamps', true)

const whitelist = ['http://localhost:3000', 'http://127.0.0.1:5173' /** other domains if any */]
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

const multer = require('multer')
const upload = multer({ dest: 'uploads/' })

const app = express()
  .use(express.json())
  // .use(cors(corsOptions))
  .use(express.urlencoded({ extended: false }))

app.listen(3000, () => console.log(`Http server listening on port ${3000}.`))


// Upload track
router.post('/upload', upload.array('pfile'), async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080') // cors error without this
  try {
    // @ts-expect-error
    const file = req.files[0]
    const path = file.path
    const name = req.body.name
    const chunks = await chunk(path)
    track = chunks
    const notes = req.body.notes
    // Save track to DB
    const Track = mongoose.model('Track', trackSchema)
    const t = new Track({ name, chunks: JSON.stringify(chunks), notes })
    t.save(function (err: Error) {
      if (err) {
        console.error('Error while uploading track', err)
        return
      }
    })
    res.status(200).send(JSON.stringify(track))
  } catch (e) {
    console.log('ERR')
    console.log(e)
    res.status(500).send()
  }
})

// Get tracks

router.get('/get-tracks', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080') // cors error without this
  const Track = mongoose.model('Track', trackSchema)
  try {
    const allTracks = await Track.find({}, '_id name notes')
    res.json(JSON.stringify({ tracks: allTracks }))
  }
  catch (err) {
    console.log('Failed getting tracks with:', err)
    res.status(500).json(JSON.stringify({ Error: 'Failed fetching tracks.' }))
  }
})

router.post('/partialData', (req, res) => {
  console.log(req.body)
  res.status(200).send()
})

app.use(router)
app.use((req, res) => res.status(404))


// WEBSOCKETS //
const { Server } = require('ws')
let track: { partials: PartialChunk[], ttsInstructions: TtsInstruction[] }[]

let mode: Mode

let startTime: number

const sockserver = new Server({ URL: process.env.WS_SERVER_URL, port: process.env.WS_SERVER_PORT })
console.log(`Websocket server listening on port ${443}.`)
sockserver.on('connection', (client: SadissWebSocket) => {
  // Assign id to new connection, needed for nonChoir partial distribution
  client.id = generateUuid()
  console.log('New client connected! Assigned id: ', client.id)

  client.onclose = () => console.log('Client has disconnected!')

  client.onmessage = (event: MessageEvent<string>) => {
    const parsed: Message = JSON.parse(event.data)
    // console.log('Received message: ', parsed.message)
    if (parsed.message === 'start') {
      if (!parsed.startTime) {
        console.error('Received start but no startTime provided.')
        return
      }
      startTime = parsed.startTime
      startSendingInterval()
    } else if (parsed.message === 'clientId') {
      client.choirId = parsed.clientId
    } else if (parsed.message === 'identifyAsAdmin') {
      client.isAdmin = true
    } else {
      // TODO: If no message in request, it was sending of partial data. Make this more clear.
      mode = parsed.mode
      track = parsed.trackData
    }
  }
})

let sendingIntervalRunning = false
// More or less accurate timer taken from https://stackoverflow.com/a/29972322/16725862
const startSendingInterval = () => {

  sendingIntervalRunning = true

  const interval = 1000 // ms
  let expected = Date.now() + interval
  let chunkIndex = 0

  // nonChoir mode: Stores partialIds and array of client ids that were given
  // the respective partial in the last iteration
  let partialMap: { [partialId: string]: string[] } = {}

  // Start
  setTimeout(step, interval)

  function step () {
    if (!sendingIntervalRunning) {
      console.log('Sending interval stopped.')
      partialMap = {}
      chunkIndex = 0
      return
    }

    if (chunkIndex >= track.length) {
      console.log('No more chunks. Stopping.')
      sendingIntervalRunning = false
      partialMap = {}
      chunkIndex = 0
      return
    }

    const dt = Date.now() - expected
    if (dt > interval) {
      console.log('Sending interval somehow broke. Stopping.')
      sendingIntervalRunning = false
      partialMap = {}
      chunkIndex = 0
      return
    }

    // Distribute partials among clients and send them to clients

    if (mode === 'choir') {
      // Choir mode
      sockserver.clients.forEach((client: SadissWebSocket) => {
        if (!client.isAdmin) {
          const partialById = track[chunkIndex].partials.find((chunk: PartialChunk) => chunk.index === client.choirId)
          if (partialById) {
            client.send(JSON.stringify({ startTime: startTime + 2, chunk: { partials: [partialById] } }))
          }
        }
      })
    } else {
      // nonChoir mode

      const clientArr: SadissWebSocket[] = Array.from(sockserver.clients)
      const clients = clientArr.filter((client: SadissWebSocket) => !client.isAdmin)
      const partials = track[chunkIndex].partials

      const newPartialMap: { [partialIndex: string]: string[] } = {}

      const allocatedPartials: { [clientId: string]: PartialChunk[] } = {}

      for (let i = 0; i < clients.length; i++) {
        allocatedPartials[clients[i].id] = []
      }

      for (const partial of partials) {
        newPartialMap[partial.index] = []

        if (partial.index in partialMap) {
          // Partial of same index was distributed last iteration
          // Distribute again to same client, if client still connected
          const clientIdsLastIteration = partialMap[partial.index]
          for (const clientId of clientIdsLastIteration) {
            const client = clients.find(c => c.id === clientId)
            if (!client) {
              // Client has disconnected
              clientIdsLastIteration.splice(clientIdsLastIteration.indexOf(clientId, 1))

              // If all clients disconnected, give to client with least partials
              if (!clientIdsLastIteration.length) {
                const clientIdWithMinPartials = getClientIdWithMinPartials(allocatedPartials)
                newPartialMap[partial.index].push(clientIdWithMinPartials)
                allocatedPartials[clientIdWithMinPartials].push(partial)
              }
            } else {
              // Client still connected
              newPartialMap[partial.index].push(client.id)
              allocatedPartials[client.id].push(partial)
            }
          }
        } else {
          // Partial was not distributed last iteration
          const clientIdWithMinPartials = getClientIdWithMinPartials(allocatedPartials)
          newPartialMap[partial.index].push(clientIdWithMinPartials)
          allocatedPartials[clientIdWithMinPartials].push(partial)
        }
      }

      // If clients with no partials, give them the partial that is least distributed
      const clientsWithoutPartials = clients.filter(client => !allocatedPartials[client.id].length)

      for (const client of clientsWithoutPartials) {
        const partialIdLeastDistributed = Object.keys(partialMap).sort((a, b) => partialMap[a].length - partialMap[b].length)[0]
        const partial = partials.find(p => p.index === +partialIdLeastDistributed)
        if (partial) {
          newPartialMap[partialIdLeastDistributed].push(client.id)
          allocatedPartials[client.id].push(partial)
        }
      }

      console.log('Allocation finished. Clients to distribute to: ', Object.keys(allocatedPartials))

      sockserver.clients.forEach((client: SadissWebSocket) => {
        if (!client.isAdmin) {
          const dataToSend: { partials: PartialChunk[], ttsInstructions?: {} } = { partials: allocatedPartials[client.id] }
          if (chunkIndex % 5 === 0) {
            dataToSend.ttsInstructions = { startTime: -1, text: chunkIndex.toString() }
          }
          client.send(JSON.stringify({ startTime: startTime + 2, chunk: dataToSend }))
        }
      })

      partialMap = newPartialMap
    }

    chunkIndex++

    expected += interval
    setTimeout(step, Math.max(0, interval - dt))
  }

  const getClientIdWithMinPartials = (allocatedPartials: { [clientId: string]: PartialChunk[] }) => {
    return Object.keys(allocatedPartials)
      .map(k => ({ clientId: k, partials: allocatedPartials[k] }))
      .sort((a, b) => a.partials.length - b.partials.length)[0].clientId

    // Probably faster
    // return Object.keys(allocatedPartials).reduce((acc, clientId) => {
    //   if (allocatedPartials[clientId].length < allocatedPartials[acc].length) {
    //     return clientId
    //   }
    //   return acc
    // })

    // Randomize between clients with least amount
    // const minPartialCount = Math.min(...Object.values(allocatedPartials).map((partials) => partials.length))
    // const minPartialCountClientIds = Object.keys(allocatedPartials)
    //  .filter((clientId) => allocatedPartials[clientId].length === minPartialCount)
    // return minPartialCountClientIds[Math.floor(Math.random() * minPartialCountClientIds.length)]
  }
}

/** Takes partial path and returns chunk array */
const chunk = async (path: string) => {
  const CHUNK_DURATION = 0.999 // float in seconds

  // Initialize chunks array and first chunk object
  let chunks = []
  const initChunk = () => {
    return {
      time: 0,
      partials: <PartialChunk[]>[],
      ttsInstructions: []
    }
  }
  let chunk = initChunk()
  chunk.time = 0

  // Open partials file
  console.log('Analyzing', path, '...')
  const fileStream = fs.createReadStream(path)
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  })
  let frameCount = 0

  // Read each line
  for await (const line of rl) {
    const f = line.split(' ')

    // Handle first few lines
    if (!frameCount && f[0] === 'frame-count') {
      frameCount = f[1]
      continue
    } else if (!frameCount || f[0] === 'frame-data') {
      continue
    }

    // Handle frame data
    const time = parseFloat(parseFloat(f[0]).toFixed(2))
    if (chunk.time == null) {
      chunk.time = time
    }
    // Create new chunk if chunk time exceeded
    if (time >= chunk.time + CHUNK_DURATION) {
      chunks.push(chunk)
      chunk = initChunk()
      chunk.time = time
    }

    const partialsCount = f[1]

    // Read each triple of frame data
    for (let i = 2; i <= f.length - 2; i += 3) {
      const index = +f[i]
      const freq = f[i + 1]
      const amp = f[i + 2]

      // Find partial if it exists in chunk array
      let partial = chunk.partials.find(p => p.index === index)
      if (!partial) { // init if it doesn't
        partial = {
          index,
          startTime: time,
          endTime: time + CHUNK_DURATION,
          breakpoints: []
        }
        chunk.partials.push(partial)
      }

      partial.breakpoints.push({
        time,
        freq,
        amp
      })
    }

  }
  chunks.push(chunk)
  console.log('Created', chunks.length, 'chunks')
  return chunks
}

const uuid = require('uuid')
const generateUuid = () => uuid.v4()

// setInterval(() => {
//   sockserver.clients.forEach((client) => {
//     const data = JSON.stringify({ 'type': 'time', 'time': new Date().toTimeString() })
//     client.send(data)
//   })
// }, 1000)

// setInterval(() => {
//   sockserver.clients.forEach((client) => {
//     const messages = ['Hello', 'What do you ponder?', 'Thank you for your time', 'Be Mindful', 'Thank You']
//     const random = Math.floor(Math.random() * messages.length)
//     let position = { x: Math.floor(Math.random() * 200), y: Math.floor(Math.random() * 150) }
//     const data = JSON.stringify({ 'type': 'message', 'message': messages[random], 'position': position })
//     client.send(data)
//   })
// }, 8000)
