const WebSocket = require('ws')
const Max = require('max-api')
const axios = require('axios');

let ws
const tracks = []

/* Log to Max console */
const log = (...args) => {
  Max.post(...args)
}

/** Fetch track list from server */
const fetch = async (endpoint) => {
  Max.outlet(['tracklist', 'clear'])
  await axios.get(`https://sadiss.net/server/${endpoint}`)
    .then(response => {
      for (const track of response.data.tracks) {
        tracks.push(track)
        Max.post(track)
        Max.outlet(['tracklist', `append ${track.name}`])
      }
    })
    .catch(error => {
      Max.post(error)
    })
}


log('Ready to connect. Click "register"')

Max.addHandler('getTracks', async () => {
  await fetch('get-tracks')
})

Max.addHandler('selectTrack', async (id) => {
  if (!tracks) {
    await fetch('get-tracks')
  }
  Max.post('select', id)
  const track = tracks[id]
  Max.outlet(['trackdetails',  track.name])
})

// Register with SADISS server
Max.addHandler("register", async () => {
	log('Connecting to SADISS server...')
  ws = new WebSocket('wss://sadiss.net/ws/:443')
  ws.onopen = () => {
    ws.send(JSON.stringify({ message: 'isAdmin' }))
  }
  log('Waiting for track start...')
  ws.onmessage = (event) => {
    let msg
    //log('Received message', event)
    switch (event) {
      case 'start':
        Max.outlet('bang')
        break
      case 'stop':
        Max.outlet('stop')
        break
    }
  }
})

