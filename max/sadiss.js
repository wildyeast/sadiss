const WebSocket = require('ws')
const Max = require('max-api')
const axios = require('axios');

let ws
const tracks = []
let selectedTrack

/* Log to Max console */
const log = (...args) => {
  Max.post(...args)
}

/** Fetch from server */
const fetch = async (endpoint, callback) => {
  await axios.get(`https://sadiss.net/server/${endpoint}`)
    .then(callback)
    .catch(error => {
      Max.post(error)
    })
}


log('Ready to connect. Click "register"')

const getTracks = async () => {
  Max.outlet(['tracklist', 'clear'])
  await fetch('get-tracks', response => {
      for (const track of response.data.tracks) {
        tracks.push(track)
        Max.post(track)
        Max.outlet(['tracklist', `append ${track.name}`])
      }
    })
}

Max.addHandler('getTracks', async () => {
  await getTracks()
})

Max.addHandler('selectTrack', async (id) => {
  if (!tracks.length) {
    await getTracks()
  }
  Max.post('select', id)
  const track = tracks[id]
  selectedTrack = track
  Max.outlet(['trackdetails',  `set ${track.name} - ${track.mode} - waveform: ${track.waveform} - tts rate: ${track.ttsRate}`])
})

Max.addHandler('startTrack', async () => {
  if (!selectedTrack) {
    Max.post('no track selected')
    return 
  }
  Max.post('starting', selectedTrack)
  return
  await fetch(`start-track/${selectedTrack.id}`, response => {
    Max.post('Track started', response.data)
  })
})

Max.addHandler('stopTrack', async () => {
  await fetch('stop-track')

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
    Max.post('rec', event)
    let msg
    //log('Received message', event)
    switch (event) {
      case 'start':
        Max.post('received start')
        Max.outlet(['clocker', 'bang'])
        break
      case 'stop':
        Max.post('received stop')
        Max.outlet(['clocker', 'stop'])
        break
    }
  }
})

