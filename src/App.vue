<template>
  <div class="app">
    <div style="display: flex; flex-direction: column; justify-content: center" class="md:w-1/2 w-11/12 border b-white p-4">
      <p>
        Select a track ID from the dropdown below and press Play to play the selected track. All partials will
        be played on this device. The ID corresponds to the tracks's ID in the database (check the
        <a :href="hostUrl + '/tracks'">Admin Interface</a> for a list of available tracks).
        If the dropdown is empty, add a track to the database via the Admin Interface and afterwards refresh this page.
      </p>
      <div class="flex flex-row justify-between items-center py-4">
        <label>Select a track ID</label>
        <select v-model="trackId">
          <option v-for="track of availableTracks" :key="track.id">{{ track.id }} - {{ track.title }}</option>
        </select>
        <button v-if="player && !player.playing" @click="play" class="border b-white p-2">Play</button>
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
    callDuration: null,
    countdownTime: -1,
    isRegistered: false,
    trackId: 1,
    availableTracks: [],
    deviceRegistrationId: null,
    intervalId: null, // This variable is used for the id of two different intervals. They are never active at the same time, still probably not ideal though.
    // hostUrl: 'http://sadiss.test.test',
    // hostUrl: 'http://8hz.at',
    hostUrl: 'https://sadiss.net',
    print: ''
  }),
  async mounted () {
    // Fetch tracks
    const res = await fetch (this.hostUrl + '/api/track')
    const json = await res.json()
    this.availableTracks = json

    // this.calculateTimeOffset()

    // // Calculate time offset
    // const now = new Date().valueOf()
    // const serverTime = await this.getTimeFromServer()
    // const nowAfterCall = new Date().valueOf()
    // this.serverTimeOffset = serverTime - now
    // this.callDuration = nowAfterCall - now

    // // Estimate server call duration
    // /*
    // const times = []
    // for (let i = 0; i < 10; i++) {
    //   const t1 = dayjs.utc().valueOf()
    //   let sTime = await this.getTimeFromServer()
    //   const t2 = dayjs.utc().valueOf()
    //   const halfLatency = (t2 - t1) / 2
    //   times.push(dayjs.utc().valueOf() - sTime + halfLatency)
    // }
    // const sum = times.reduce((a, b) => a + b, 0)
    // const callDuration = (sum / times.length) || 0
    // */

    //   // console.log("Average server time to local time difference: ", avgServertimeDifference)

    // // Print time information to screen
    // this.print += 'localtime: ' + this.formatUnixTime(now) + '<br>servertime: ' + this.formatUnixTime(serverTime) + '<br>offset: ' + this.serverTimeOffset + 'ms'
    // if (this.serverTimeOffset > 0) this.print += ' (server ahead)'
    // else this.print += ' (server behind)'
    // this.print += '<br>call duration: ' + this.formatUnixTime(this.callDuration)
    // this.print += '<br>localtime with offset: ' + this.formatUnixTime(this.nowWithOffset())

    // Initialize player
    this.player = new Player()

  },
  methods: {
    formatUnixTime (t) {
      return String(t).slice(-5)
    },
    nowWithOffset () {
      return new Date().valueOf() + this.serverTimeOffset - this.callDuration
    },
    async register () {
      const response = await fetch(this.hostUrl + '/api/client/create', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({performance_id: 1})
      })
      // console.log(response)
      const data = await response.json()
      this.token = data.token
      this.deviceRegistrationId = data.id

      // Check for start immediately, afterwards check in intervals.
      await this.checkForStart();

      this.intervalId = window.setInterval(async () => {
        await this.checkForStart();
      }, 1500);
      this.isRegistered = true;
    },
    async checkForStart () {
      const response = await fetch(`${this.hostUrl}/api/client/${this.token}`)
      const clientData = await response.json()
      if (clientData.client['start_time']) {
        window.clearInterval(this.intervalId)
        this.startTime = clientData.client['start_time']
        this.calculateTimeOffset()
        this.partials = clientData.client['partials']
        // this.player.setup(this.partials)
        // this.serverTimeOffset = dayjs.utc().valueOf() - clientData.time
        // console.log(this.serverTimeOffset, clientData.time - dayjs.utc().valueOf() + this.serverTimeOffset)
        this.waitForStart()
      } else {
        console.log(clientData.client, clientData.time)
      }
      return clientData
    },
    now () {
      return new Date().valueOf()
    },
    async waitForStart () {
      this.player = new Player()
      this.player.setup(this.partials)
      // this.player.mergeBreakpoints(this.partials)
      const startTimeUnix = dayjs.utc(this.startTime).valueOf()
      this.print += '<br>local with offset before countdown: ' + this.formatUnixTime(this.nowWithOffset()) + '<br>starttime: ' + this.formatUnixTime(startTimeUnix)
      let countdown = true
      this.print += '<br><br> Scheduled start time: ' + this.formatUnixTime(startTimeUnix)
      let nowWithOffset = 0
      while (countdown) {
        const now = new Date().valueOf()
        const serverTime = await this.getTimeFromServer()
        const nowAfterCall = new Date().valueOf()
        const serverTimeOffset = serverTime - now
        const callDuration = nowAfterCall - now
        nowWithOffset = now + serverTimeOffset - callDuration
        if (nowWithOffset >= startTimeUnix) {
          countdown = false
        }
        // console.log('now with offset', this.formatUnixTime(nowWithOffset))
        this.countdownTime = Math.floor((startTimeUnix - nowWithOffset) / 1000)
        await new Promise(r => setTimeout(r, 1));
      }

      this.print += '<br> nowWithOffset: ' + this.formatUnixTime(nowWithOffset)
      this.player.play()
      this.isRegistered = false;
      // Reregister when done
      // await this.register()
          /*
        } else {
          this.countdownTime = Math.floor((startTime - localNow + this.serverTimeOffset) / 1000)
          // console.log(this.countdownTime)
        }
      }, 5);
        */
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

    async play () {
      // Fetch breakpoints from server
      const res = await fetch (this.hostUrl + '/api/track/' + this.trackId)
      const json = await res.json()
      const partialData = JSON.parse(json.partials)
      this.player.mergeBreakpoints(partialData)
      this.player.setup()
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
