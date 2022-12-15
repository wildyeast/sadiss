// Code in part taken from https://www.pubnub.com/blog/nodejs-websocket-programming-examples/

// HTTP SERVER //
import express from 'express';
import { PartialChunk, WebSocketWithId } from './types/types'

const cors = require('cors')
const router = express.Router()

const whitelist = ['http://localhost:3000', 'http://127.0.0.1:5173' /** other domains if any */]
const corsOptions = {
  origin: (origin: string, callback: Function) => {
    console.log('Cors options hit: ', origin)
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

const app = express()
  .use(express.json())
  .use(cors(corsOptions))
  .use(express.urlencoded({ extended: false }))

app.listen(3000, () => console.log(`Http server listening on port ${3000}.`))


router.post('/partialData', (req, res) => {
  console.log(req.body)
  res.status(200).send()
})

app.use(router)
app.use(function (req, res) {
  res.status(404)
})


// WEBSOCKETS //
const { Server } = require('ws')
let partialChunks: PartialChunk[][] = []
let mode: string

const sockserver = new Server({ port: 443 })
console.log(`Websocket server listening on port ${443}.`)
sockserver.on('connection', (ws: WebSocketWithId) => {
  console.log('New client connected!')
  ws.onclose = () => console.log('Client has disconnected!')
  ws.onmessage = (event: MessageEvent<string>) => {
    const parsed: { message: string, [key: string]: any } = JSON.parse(event.data)
    console.log('Received message: ', parsed.message)
    if (parsed.message === 'start') {
      console.log('Received start from client.')
      mode = parsed.mode
      sendChunksToClient()
    } else if (parsed.message === 'chunkRequest') {
      console.log('Received chunkRequest from client.')
      sendChunksToClient()
    } else if (parsed.message === 'id') {
      console.log('Received id from client.')
      ws.id = parsed.clientId
    } else {
      console.log('Received partialChunks from client.')
      partialChunks = parsed.partialChunks
    }
  }
})

const sendChunksToClient = () => {
  let chunks = []
  for (const partial of partialChunks) {
    chunks.push(partial.shift())
  }

  if (mode === 'choir') {
    for (const client of sockserver.clients) {
      if (client.id) {
        const chunk = chunks.find(chunk => chunk?.index === client.id)
        const data = JSON.stringify({ partialData: chunk })
        client.send(data)
      }
    }
  } else {
    // Convert clients Set to arr
    // TODO: Remove any
    const clients: any[] = Array.from(sockserver.clients)

    const clientCount = clients.length

    // Make sure there are always more (or same amount) chunks than clients
    while (clientCount > chunks.length) {
      chunks = [...chunks, ...chunks]
    }

    console.log({ clientCount, chunksCount: chunks.length })

    for (let i = 0; i < chunks.length; i++) {
      clients[i % clientCount].send(JSON.stringify({ partialData: chunks[i] }))
    }
  }
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
