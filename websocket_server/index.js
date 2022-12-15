// Code in part taken from https://www.pubnub.com/blog/nodejs-websocket-programming-examples/

// HTTP SERVER //
const express = require('express')
const cors = require('cors')
const router = express.Router()

const whitelist = ['http://localhost:3000', 'http://127.0.0.1:5173' /** other domains if any */]
const corsOptions = {
  origin: (origin, callback) => {
    console.log('Cors options hit: ', origin)
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true) // TODO: Find out what exactly this does. Code is copy/pasted
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
let partialChunks = []
let mode

const sockserver = new Server({ port: 443 })
console.log(`Websocket server listening on port ${443}.`)
sockserver.on('connection', (ws) => {
  console.log('New client connected!')
  ws.on('close', () => console.log('Client has disconnected!'))
  ws.on('message', message => {
    message = JSON.parse(message)
    console.log('Received message: ', message)
    if (message.message === 'start') {
      console.log('Received start from client.')
      mode = message.mode
      sendChunksToClient()
    } else if (message === 'chunkRequest') {
      console.log('Received chunkRequest from client.')
      sendChunksToClient()
    } else if (message.message === 'id') {
      console.log('Received id from client.')
      ws.id = message.clientId
    } else {
      console.log('Received partialChunks from client.')
      partialChunks = message.partialChunks
    }
  })
})

const sendChunksToClient = () => {
  const chunks = []
  for (const partial of partialChunks) {
    chunks.push(partial.shift())
  }

  if (mode === 'choir') {
    for (const client of sockserver.clients) {
      if (client.id) {
        const chunk = chunks.find(chunk => chunk.index === client.id)
        data = JSON.stringify({ partialData: chunk })
        client.send(data)
      }
    }
  } else {
    // Convert clients Set to arr
    const clients = Array.from(sockserver.clients)

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
