<template>
  <div class="app">
    <!-- <button @click="prepare">timingSrc update</button> -->
    <!-- {{ timingSrcPosCurrFormatted }} -->
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
    timingSrcPosCurr: 0,
    hasStarted: false,
    timingSetupDone: false,
    beep: null,
    offset: null,
    time: 0,
    localTimingObj: null
  }),
  // computed: {
  //   timingSrcPosCurrFormatted: function () {
  //     return this.timingSrcPosCurr.toFixed(2)
  //   }
  // },
  async mounted () {
    // this.timingProvider = new TimingProvider('ws://192.168.0.87:2276');
    this.timingProvider = new TimingProvider('wss://sadiss.net/zeitquelle');
    this.timingObj = new TimingObject(this.timingProvider)
    this.localTimingObj = new TimingObject({ velocity: 1 })

    // Fetch tracks
    // const res = await fetch(this.hostUrl + '/api/track')
    // const json = await res.json()
    // this.availableTracks = json

    // Initialize player
    this.player = new Player()
  },
  methods: {
    async register () {
      this.player.globalTime = this.globalTime()
      
      this.timingObj.onchange =  () => {
        // console.log(this.timingObj.query().position - this.localTimingObj.query().position)
        console.log("Global time object changed.")
      };

      // Start audio context.
      // this.player.audioContext = new(window.AudioContext || window.webkitAudioContext)()

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

      // window.setInterval(() => {
      //   this.timingSrcPosCurr = this.timingObj.query().position
      // }, 5)
    },

    async checkForStart (token) {
      const response = await fetch(`${this.hostUrl}/api/client/${token}`)
      const clientData = await response.json()
      if (clientData.client['start_time']) {
        console.log("Start time from server: ", clientData.client['start_time'])
        window.clearInterval(this.intervalId)
        // const startTimeFromServer = Number(this.timingObj.query().position.toFixed(1)) + 3
        // this.startPrepAtPosition = clientData.client['start_time']
        const startTimeFromServer = clientData.client['start_time']
        const partialData = clientData.client['partials']
        // Conversion only necessary if playing from chunks sent by db (I think), not when playing all partials on one client directly
        if (typeof partialData === 'string') {
          let json = JSON.parse(partialData)
          this.partials = json.reverse()
        } else {
          this.partials = partialData
        }
        
        let prepareStarted = false

        const intervalId = window.setInterval(() => {
          // console.log(this.localTime(), this.globalTime(), this.globalToLocalTimeOffset())
          if (this.localTimeWithOffset() >= startTimeFromServer) {
            // const startNextStepAtLocalPos = this.localTime() + 3
            const startNextStepAtLocalPos = 0
            console.log("Start time reached at localTimeWithOffset: ", this.localTimeWithOffset())
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
        if (this.localTimeWithOffset() >= startNextStepAtLocalPos) {
          console.log("Waiting on start. localTimeWithOffset: ", this.localTimeWithOffset())
          if (!this.hasStarted) {
            this.start()
            this.hasStarted = true
          }
          window.clearInterval(intervalId)
        }
      }, 1)
    },

    async start () {
      const startInSec = 10
      console.log("Starting setup. localTimeWithOffset: ", this.localTimeWithOffset() + startInSec)
      // Start audioContext
      const t1 = this.globalTime()
      this.player.audioContext = new(window.AudioContext || window.webkitAudioContext)()
      console.log("Time taken for setting up audioCtx: ", this.globalTime() - t1)
      this.player.setup(this.partials, startInSec, 0)
      this.isRegistered = false;

      // Reregister when done
      // await this.register()
    },

    globalTime () {
      return this.timingObj.query().position
    },

    localTime () {
      return this.localTimingObj.query().position
    },

    globalToLocalTimeOffset () {
      return this.globalTime() - this.localTime()
    },

    localTimeWithOffset () {
      // return this.localTime() + this.globalToLocalTimeOffset()
      return this.globalTime()
    },






    convertPositionToCtxTime (pos) {
      return pos - this.offset
    },

    // position  ctxTime   offset
    // 600       100       -500
    // 610       110       -500

    now () {
      return new Date().valueOf()
    },

    async calculateTimeOffset () {
      const now = new Date().valueOf()
      const serverTime = await this.getTimeFromServer()
      const nowAfterCall = new Date().valueOf()
      this.serverTimeOffset = serverTime - now
      this.callDuration = nowAfterCall - now

      this.print += '<br>localtime: ' + this.formatUnixTime(now) + '<br>servertime: ' + this.formatUnixTime(serverTime) + '<br>offset: ' + this.serverTimeOffset + 'ms'
      if (this.serverTimeOffset > 0) this.print += ' (server ahead)'
      else this.print += ' (server behind)'
      this.print += '<br>call duration: ' + this.formatUnixTime(this.callDuration)
      this.print += '<br>localtime with offset: ' + this.formatUnixTime(this.nowWithOffset())
    },

    // async getTimeFromServer () {
    //   const response = await fetch(`${this.hostUrl}/api/time`)
    //   const data = await response.json()
    //   return data.time
    // },
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
