<template>
  <div class="app">
    <div style="display: flex; flex-direction: column; justify-content: center">
      <div>
        
      </div>
      <button @click="play">Play</button>
      <button @click="register">Register</button>
      <div v-if="countdownTime >= 0" style="display: flex; justify-content: center; font-size: 50px;">
        {{ countdownTime }}
      </div>
      <div v-else>
        Track starting soon
      </div>
    </div>
  </div>
</template>
<script>
/* global getOscillator */
import { modules, bps } from './constants'
import dayjs from 'dayjs'
import dayjsPluginUTC from 'dayjs/plugin/utc'
dayjs.extend(dayjsPluginUTC)

import Player from './Player'

export default {
  name: 'App',
  components: { },
  data: () => ({
    modules,
    player: null,
    token: null,
    partials: null,
    startTime: null,
    serverTimeOffset: null,
    countdownTime: -1,
    hasStarted: false,
    // hostUrl: 'http://sadiss.test.test',
    hostUrl: 'http://8hz.at'
  }),
  async mounted () {
    // Fetch breakpoints from server
    const res = await fetch (this.hostUrl + '/api/track/2')
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
      console.log(response)
      const data = await response.json()
      this.token = data.token

      const intervalId = window.setInterval(async () => {
        // const localNow = dayjs.utc().valueOf()
        const clientData = await this.checkForStart();
        if (clientData.client['start_time']) {
          window.clearInterval(intervalId)
          this.startTime = clientData.client['start_time']
          this.partials = clientData.client['partials']
          for (const partial of JSON.parse(this.partials)) {
            console.log("Partial: " + partial.index)
          }
          // const oneWayLatency = (dayjs.utc().valueOf() - localNow) / 2
          this.serverTimeOffset = dayjs.utc().valueOf() - clientData.time
          console.log(this.serverTimeOffset, clientData.time - dayjs.utc().valueOf() + this.serverTimeOffset)
          this.waitForStart()
        } else {
          console.log(clientData.client, clientData.time)
        }
      }, 1500);
    },
    async checkForStart () {
      const response = await fetch(`${this.hostUrl}/api/client/${this.token}`)
      const data = await response.json()
      return data
    },
    async waitForStart () {
      const intervalId = window.setInterval(async () => {
        const startTime = dayjs.utc(this.startTime).valueOf()
        // console.log(startTime, nowServer, Date.now())
        const localNow = dayjs.utc().valueOf()
        if (startTime <= localNow - this.serverTimeOffset) {
          window.clearInterval(intervalId)
          if (!this.hasStarted) {
            console.log('Starting. Server time should be: ', localNow - this.serverTimeOffset, "Compare this to the output of other connected devices to judge how accuractely synced the starting time is.")
            this.player = new Player(this.partials)
            this.player.play()
            this.hasStarted = true;
          }
        } else {
          // console.log(`Starting in: ${startTime - nowServer}ms`)
          this.countdownTime = Math.abs(Math.floor((dayjs.utc().valueOf() - this.serverTimeOffset - startTime) / 1000))
        }
      }, 5);
    },

    async play () {
      this.player.play()
    },

    async getTimeFromServer () {
      const response = await fetch(`${this.hostUrl}/api/time`)
      const data = await response.json()
      return data.time
    },
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
