<template>
  <div class="app">
    <!-- <button @click="prepare">timingSrc update</button> -->
    <div style="display: flex; flex-direction: column; justify-content: center" class="md:w-1/2 w-11/12 border b-white p-4">
      <p>
        Select a track ID from the dropdown below and press Play to prepare the selected track. All partials will
        be played on this device. The ID corresponds to the tracks's ID in the database (check the
        <a :href="hostUrl + '/tracks'">Admin Interface</a> for a list of available tracks).
        If the dropdown is empty, add a track to the database via the Admin Interface and afterwards refresh this page.
      </p>
      <div class="flex flex-row justify-between items-center py-4">
        <label>Select a track ID</label>
        <select v-model="trackId">
          <option v-for="track of availableTracks" :key="track.id">{{ track.id }} - {{ track.title }}</option>
        </select>
        <button v-if="player && !player.playing" @click="prepare" class="border b-white p-2">Play</button>
        <button v-else @click="player.stop" class="border b-white p-2">Stop</button>
      </div>
    </div>
    <div class="md:w-1/2 w-11/12 border b-white p-4">
      <p>
        Press Register below to register this device to receive partials when 'Start track' is pressed
        in the track details page of a track in the Admin Interface. The registration ID of the device displayed after
        pressing Register will be visible in the list of registered clients in the track details page in the Admin Interface.
        This ID changes with every registration.
      </p>
      <button @click="register" class="border b-white p-2 mt-4">Register</button>
      {{ timingSrcPosition }}
      <div class="mt-4">
        <p v-if="countdownTime > 0" style="display: flex; justify-content: center; font-size: 50px;">{{ countdownTime }}</p>
        <p v-else-if="player && !player.playing && isRegistered">Device registered with ID {{ deviceRegistrationId }}. Waiting for track start.</p>
        <p v-else-if="player && player.playing">Track currently playing.</p>
        <p v-else>Device not registered.</p>
        <div v-html="print" style="margin-top: 1rem;" />
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
import { TimingProvider } from 'timing-provider';
import { TimingObject } from 'timing-object';
import * as TIMINGSRC from 'timingsrc'

import Player from './Player'

export default {
  name: 'App',
  components: { },
  data: () => ({
    modules,
    player: null,
    partials: null,
    startPrepAtPosition: null,
    serverTimeOffset: null,
    callDuration: null,
    countdownTime: -1,
    isRegistered: false,
    trackId: 1,
    availableTracks: [],
    deviceRegistrationId: null,
    intervalId: null,
    // hostUrl: 'http://sadiss.test.test',
    // hostUrl: 'http://8hz.at',
    hostUrl: 'https://sadiss.net',
    print: '',
    timingProvider: null,
    timingObj: null,
    currentVel: 0,
    timingSrcPosition: null,
    hasStarted: false,
    timingSetupDone: false,
    beep: null,
    offset: null,
    time: 0,
    localTimingObj: null,
    initialTimingSrcIntervalId: null,

    clients: []
  }),
  async mounted () {
    this.timingProvider = new TimingProvider('wss://sadiss.net/zeitquelle');
    this.timingObj = new TimingObject(this.timingProvider)

    // Uncomment for timing server stress testing
    window.setTimeout(() => {
      this.timingObj.update({ velocity: 1 })
    }, 1000)

    // Test 1: Many clients on this device
    // window.setInterval(() => {
    //   this.clients.push(this.createClient())
    //   console.log(this.clients[0].pos, this.clients.length)
    // }, 500)

    // Test 2: X clients on this device (Sehr stressig fuers phone)
    // for (let i = 0; i < 5; i++) {
    //   this.clients.push(this.createClient())
    // }
    // window.setInterval(() => {
    //   console.log(" ")
    //   for (const client of this.clients) {
    //     console.log(client.pos)
    //   }
    // }, 1000)

    // // Fetch tracks
    // const res = await fetch(this.hostUrl + '/api/track')
    // const json = await res.json()
    // this.availableTracks = json
  },
  methods: {
    async register () {
      this.timingObj.onchange =  (event) => {
        console.log("Global TimeObject onchange event triggered.")
      };

      this.initialTimingSrcIntervalId = window.setInterval(() => {
        const q = this.timingObj.query()
        this.timingSrcPosition = q.position.toFixed(1)
      }, 10)

      // Initialize player
      this.player = new Player()
      // Start audio context.
      this.player.audioContext = new(window.AudioContext || window.webkitAudioContext)()

      const response = await fetch(this.hostUrl + '/api/client/create', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({performance_id: 1})
      })
      const data = await response.json()
      this.deviceRegistrationId = data.id // Only used in UI.

      // Check for start immediately, afterwards check in intervals of 1 second.
      await this.checkForStart(data.token);
      this.intervalId = window.setInterval(async () => {
        // console.log(this.timingObj.query().position)
        await this.checkForStart(data.token);
      }, 1000);
      this.isRegistered = true;
    },

    async checkForStart (token) {
      const response = await fetch(`${this.hostUrl}/api/client/${token}`)
      const clientData = await response.json()
      if (clientData.client['start_time']) {
        console.log("Start time from server: ", clientData.client['start_time'])
        window.clearInterval(this.intervalId)
        const startTimeFromServer = Number(clientData.client['start_time'])
        // Conversion only necessary if playing from chunks sent by db (I think), not when playing all partials on one client directly
        this.partialData = this.convertPartialsIfNeeded(clientData.client['partials'])
        this.player.partialData = this.partialData
        
        let prepareStarted = false

        window.clearInterval(this.initialTimingSrcIntervalId)
        const intervalId = window.setInterval(() => {
          this.timingSrcPosition = this.globalTime()
          if (this.timingSrcPosition >= startTimeFromServer) {
            this.player.offset = this.timingSrcPosition - this.player.audioContext.currentTime // Do not change!
            const startNextStepAtLocalPos = 0
            if (!prepareStarted) { // Prevent multiple calls of prepare() if checkForStart() short interval time
              this.prepare(startNextStepAtLocalPos)
              prepareStarted = true
            }
            window.clearInterval(intervalId)
          }
        }, 1)
      }
      return clientData
    },

    prepare (startNextStepAtLocalPos) {
      const intervalId = window.setInterval(() => {
        this.timingSrcPosition = this.globalTime()
        if (this.timingSrcPosition >= startNextStepAtLocalPos) {
          if (!this.hasStarted) {
            this.start()
            this.hasStarted = true
          }
          window.clearInterval(intervalId)
        }
      }, 1)
    },

    async start () {
      const startInSec = 4
      const q = this.globalTime()
      const ctxTime = this.player.audioContext.currentTime
      const now = q - this.player.offset // Do not change!
      console.log("ZQ - ctxTime - offset (should be 0): ", q - ctxTime - this.player.offset)
      this.player.setup(this.partialData, startInSec, now)
      this.isRegistered = false;

      // Reregister when done
      // await this.register()
    },

    globalTime () {
      return this.timingObj.query().position
    },

    convertPartialsIfNeeded(partialData) {
      let partials;
      if (typeof partialData === 'string') {
        let json = JSON.parse(partialData)
        partials = json.reverse()
      } else {
        partials = partialData
      }
      return partials
    },
    createClient () {
      class Client {
        pos = 0
        constructor () {
          const timingProvider = new TimingProvider('wss://sadiss.net/zeitquelle');
          const timingObj = new TimingObject(timingProvider)
          window.setTimeout(() => {
          }, 5000)
          window.setInterval(() => {
            this.pos = timingObj.query().position
          }, 2)
        }
      }
      return new Client()
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
