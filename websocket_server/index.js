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
  // console.log(req.body)
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

const sockserver = new Server({ port: 443 })
console.log(`Websocket server listening on port ${443}.`)
sockserver.on('connection', (ws) => {
  console.log('New client connected!')
  ws.on('close', () => console.log('Client has disconnected!'))
  ws.on('message', message => {
    message = JSON.parse(message)
    console.log('Received message: ', message)
    if (message === 'start') {
      console.log('Start sending individual chunks.')
      const chunk = partialChunks.shift()
      sockserver.clients.forEach((client) => {
        const data = JSON.stringify({ message, chunk })
        client.send(data)
      })
    } else if (message === 'chunkRequest') {
      const chunk = partialChunks.shift()
      sockserver.clients.forEach((client) => {
        const data = JSON.stringify({ message, chunk })
        client.send(data)
      })
    } else {
      console.log('Received partialChunks from client.')
      partialChunks = message.partialChunks
    }
  })
})

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
