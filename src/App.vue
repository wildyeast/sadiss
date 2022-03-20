<template>
  <div class="app">
    <div style="display: flex; flex-direction: column; justify-content: center" class="md:w-1/2 w-11/12 border b-white p-4">
      <p>
        Select a track ID from the dropdown below and press play to play the selected track. All partials will
        be played on this device. The ID corresponds to the tracks's ID in the database (check the
        <a :href="hostUrl + '/tracks'">Admin Interface</a> for a list of available tracks).
        If the dropdown is empty, add a track to the database via the Admin Interface and afterwards refresh this page.
      </p>
      <div class="flex flex-row justify-between items-center py-4">
        <label>Select a track ID</label>
        <select v-model="trackId">
          <option v-for="id of availableTrackIds" :key="id">{{ id }}</option>
        </select>
        <button v-if="player && !player.playing" @click="play" class="border b-white p-2">Play</button>
        <button v-else @click="player.stop" class="border b-white p-2">Stop</button>
      </div>
    </div>
    <div>
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
    trackId: 1,
    availableTrackIds: [],
    // hostUrl: 'http://sadiss.test.test',
    hostUrl: 'http://8hz.at'
  }),
  async mounted () {
    const res = await fetch (this.hostUrl + '/api/track')
    const json = await res.json()
    this.availableTrackIds = json.map(track => track.id)

    // Initialize player
    this.player = new Player()

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
      // Fetch breakpoints from server
      const res = await fetch (this.hostUrl + '/api/track/' + this.trackId)
      const json = await res.json()
      const partialData = JSON.parse(json.partials)
      this.player.partialData = partialData
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
  --primaryColor: white;
  --secondaryColor: maroon;
  --tertiaryColor: lightblue;
  color: var(--primaryColor);
  font-family: monospace;
  font-size: 1.1em;
  display: flex;
  flex-flow: column;
  align-items: center;
  overflow: hidden;
}
</style>
