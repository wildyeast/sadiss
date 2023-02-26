const WebSocket = require('ws')
const Max = require('max-api')

let trackTime = -1
let motion

Max.post('Ready to connect. Click "register"')
Max.addHandler("register", async () => {

	Max.post('Connecting to SADISS server...')
  const ws = new WebSocket('wss://sadiss.net/ws/:443')

  ws.onopen = () => {
    ws.send(JSON.stringify({ message: 'isAdmin' }))
  }

  Max.post('Waiting for track start...')

  ws.onmessage = (event) => {
    if (event.data === 'start') {
      Max.post("Start message received")
      Max.outlet('bang')
    } else if (event.data === 'stop') {
      Max.post("Stop message received")
      Max.outlet('stop')
    }
  }
})
