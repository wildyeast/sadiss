<template>
  <div class="app">
    <div style="display: flex; flex-direction: column; justify-content: center">
      <button @click="player.play">Play</button>
      <button @click="register">Register</button>
      <div v-if="countdownTime >= 0" style="display: flex; justify-content: center; font-size: 50px;">{{ countdownTime }}</div>
      <div v-else>Track starting soon</div>
    </div>
  </div>
</template>
<script>
/* global getOscillator */
import { modules, bps } from './constants'
import { Player } from './Player'

export default {
  name: 'App',
  components: { },
  data: () => ({
    modules,
    player: null,
    token: null,
    partials: null,
    startTime: null,
    hostUrl: 'http://sadiss.test.test',
    countdownTime: -1
    // hostUrl: 'http://8hz.at'
  }),
  async mounted () {
    // Fetch breakpoints from server
    const res = await fetch ('http://8hz.at/api/track/3')
    const json = await res.json()
    const partialData = JSON.parse(json.partials)
    // Initialize player
    this.player = new Player(partialData)
  },
  methods: {
    async register () {
      const response = await fetch(this.hostUrl + '/api/client/create', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({performance_id: 1})
      })
      const data = await response.json()
      this.token = data.token

      const intervalId = window.setInterval(async () => {
        const clientData = await this.checkForStart();
        if (clientData['start_time']) {
          window.clearInterval(intervalId)
          this.startTime = clientData['start_time']
          this.partials = clientData['partials']
          this.waitForStart()
        } else {
          console.log(clientData)
        }
      }, 1000);
      
    },
    async checkForStart () {
      const response = await fetch(`${this.hostUrl}/api/client/${this.token}`)
      const data = await response.json()
      return data
    },
    async waitForStart () {
      const intervalId = window.setInterval(async () => {
        // TODO: Hardcoding the offset is exceedingly silly, but I spent way too much time trying to make it work without it.
        // The problem is that the start_time from db is UTC, while Date.now() is local, which is +1h
        // hence the offset of 3600000ms which is one hour.
        const nowWithOffset = Date.now() - 3600000
        if (new Date(this.startTime).getTime() <= nowWithOffset) {
          window.clearInterval(intervalId)
          console.log('Starting')
          this.player = new Player(this.partials)
          this.player.play()
        } else {
          console.log(`Starting in: ${new Date(this.startTime).getTime() - nowWithOffset}ms`)
          this.countdownTime = Math.floor((new Date(this.startTime).getTime() - nowWithOffset) / 1000)
        }
      }, 10);
    }

  }
}
</script>
<style>
html, body {
  background-color: black;
}

.app {
  --primaryColor: #11bd39;
  --secondaryColor: maroon;
  --tertiaryColor: lightblue;
  color: var(--primaryColor);
  font-family: 'UnifrakturCook', cursive;
  font-size: 1.1em;
  display: flex;
  flex-flow: column;
  align-items: center;
  overflow: hidden;
}
</style>
