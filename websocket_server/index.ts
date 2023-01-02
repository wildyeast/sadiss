// Code in part taken from https://www.pubnub.com/blog/nodejs-websocket-programming-examples/

// HTTP SERVER //
import express from 'express'
import { PartialChunk, WebSocketWithIds, Message, TtsInstruction, Mode } from './types/types'
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
      // TODO: Find out what exactly the follwing line does. Code is copy/pasted.
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
  //.use(cors(corsOptions))
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

const sockserver = new Server({ port: 444 })
console.log(`Websocket server listening on port ${443}.`)
sockserver.on('connection', (client: WebSocketWithIds) => {
  // Assign id to new connection, needed for nonChoir partial distribution
  client.id = sockserver.clients.size
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
  setTimeout(step, interval)
  let chunkIndex = 0

  function step () {

    if (!sendingIntervalRunning) {
      console.log('Sending interval stopped.')
      return
    }

    if (chunkIndex >= track.length) {
      console.log('No more chunks. Stopping.')
      return
    }

    const dt = Date.now() - expected
    if (dt > interval) {
      sendingIntervalRunning = false
      console.log('Sending interval somehow broke. Stopping.')
      return
    }

    // Send data to clients
    // TODO: Distribute partials, right now all partials are sent to all clients

    // Choir mode
    if (mode === 'choir') {
      sockserver.clients.forEach((client: WebSocketWithIds) => {
        const partialById = track[chunkIndex].partials.find((chunk: PartialChunk) => chunk.index === client.choirId)
        if (partialById) {
          client.send(JSON.stringify({ startTime: startTime + 2, chunk: { partials: [partialById] } }))
        }
      })
    } else {
      // nonChoir mode

      const clients = sockserver.clients
      const partials = track[chunkIndex].partials

      // key is client.id
      const allocatedPartials: { [key: string]: PartialChunk[] } = {}

      // key is partial.index
      const partialMap: { [key: string]: WebSocketWithIds | undefined } = {}

      for (let i = 0; i < clients.length; i++) {
        allocatedPartials[clients[i].id] = []
      }

      for (let i = 0; i < partials.length; i++) {
        const partial = partials[i]
        let client: WebSocketWithIds | undefined

        if (partialMap[partial.index]) {
          client = partialMap[partial.index]
          if (!(client && client.id in allocatedPartials)) {
            // Client has disconnected, redistribute partial
            client = undefined
            delete partialMap[partial.index]
          }
        }

        if (!client) {
          client = clients[i % clients.length]
          partialMap[partial.index] = client
        }

        if (client) {
          allocatedPartials[client.id].push(partial)
        }
      }

      // Make sure all clients get at least one partial
      for (const client of clients) {
        if (allocatedPartials[client.id].length === 0) {
          const unallocatedPartials = Object.values(allocatedPartials).flat();
          if (unallocatedPartials.length > 0) {
            const partial = unallocatedPartials.pop()
            if (partial) {
              allocatedPartials[client.id].push(partial)
              if (partialMap[partial.index]) {
                delete partialMap[partial.index]
              }
            }
          }
        }
      }

      sockserver.clients.forEach((client: WebSocketWithIds) => {
        client.send(JSON.stringify({ startTime: startTime + 2, chunk: allocatedPartials[client.id] }))
      })
    }


    chunkIndex++

    expected += interval
    setTimeout(step, Math.max(0, interval - dt))
  }

}

// const sendData = (dataToSend: Message) => {
//   sockserver.clients.forEach((client: WebSocketWithId) => {
//     const data: Message = {
//       startTime: dataToSend.startTime
//     }
//     if (client.id) {
//       if (dataToSend.partialChunks.length) {
//         const chunk = dataToSend.partialChunks.find((chunk: PartialChunk) => chunk.index === client.id)
//         data.partialData = [chunk]
//       }

//       if (dataToSend.ttsInstructions.length) {
//         const ttsInstruction = dataToSend.ttsInstructions.find((instruction: TtsInstruction) => instruction.voice === client.id)
//         if (ttsInstruction) {
//           data.ttsInstruction = ttsInstruction
//         }
//       }
//       client.send(JSON.stringify(data))
//     }
//   })
//   console.log('Sent data to client.')
// }

// const prepareNextChunks = () => {
//   const chunks: PartialChunk[] = []
//   for (const partial of partialChunks) {
//     const nextChunk = partial.shift()
//     if (nextChunk) {
//       chunks.push(nextChunk)
//     }
//   }
//   return chunks
// }

// const prepareNextTtsInstructions = () => {
//   const instructions: TtsInstruction[] = []
//   for (const instruction of ttsInstructions) {
//     const nextInstruction = instruction.shift()
//     if (nextInstruction) {
//       instructions.push(nextInstruction)
//     }
//   }
//   return instructions
// }

// const prepareChunks = (mode: Mode) => {

//   if (!partialChunks.length) {
//     console.log('No more chunks!')
//     sockserver.clients.forEach((client: WebSocket) => {
//       client.send(JSON.stringify({ partialData: [] }))
//     })
//   }

//   let chunks: PartialChunk[] = []
//   let nextTtsInstructions: TtsInstruction[] = []

//   for (const partial of partialChunks) {
//     const nextChunk = partial.shift()
//     if (nextChunk) {
//       chunks.push(nextChunk)
//     }
//   }

//   for (const ttsInstruction of ttsInstructions) {
//     const nextTtsInstruction = ttsInstruction.shift()
//     if (nextTtsInstruction) {
//       nextTtsInstructions.push(nextTtsInstruction)
//     }
//   }

//   if (mode === 'choir') {
//     sockserver.clients.forEach((client: WebSocketWithId) => {
//       if (client.id) {
//         const chunk = chunks.find(chunk => chunk.index === client.id)
//         const data: Message = {
//           partialData: chunk ? [chunk] : []
//         }

//         const ttsInstruction = nextTtsInstructions.find(instruction => instruction.voice === client.id)
//         if (ttsInstruction) {
//           data['ttsInstruction'] = ttsInstruction
//         }

//         client.send(JSON.stringify(data))
//       }
//     })
//     console.log('Sent data to clients')
//   } else {
//     // Convert clients Set to array
//     const clients: WebSocketWithId[] = Array.from(sockserver.clients)

//     const clientCount = clients.length

//     // Make sure there are always at least as many chunks as there are clients.
//     while (chunks.length && clientCount > chunks.length) {
//       console.log('Multiplying partials.')
//       chunks = [...chunks, ...chunks]
//     }

//     // TODO: This can probably be refactored for better performance.
//     const groupedChunks: PartialChunk[][] = Array.from({ length: clientCount }, () => [])

//     for (let i = 0; i < chunks.length; i++) {
//       groupedChunks[i % clientCount].push(chunks[i])
//     }

//     for (let i = 0; i < groupedChunks.length; i++) {
//       const data: Message = {
//         partialData: groupedChunks[i]
//       }
//       clients[i].send(JSON.stringify(data))
//     }
//     console.log('Sent data to clients')
//   }
// }


/* Chunk structure:
partials [{
  index, startTime, endTime, breakpoints [{ time, freq, amp }]
}],
ttsInstructions [{
  startTime, text 
}]
*/

/** Takes partial path and returns chunk array */
const chunk = async (path: string) => {
  const CHUNK_DURATION = 0.999 // float in seconds

  // Initialize chunks array and first chunk object
  let chunks = []
  const initChunk = () => {
    return {
      time: 0,
      partials: [],
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
