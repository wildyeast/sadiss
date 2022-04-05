<template>
  <div class="app">
    <!-- <button @click="prepare">timingSrc update</button> -->
    <!-- {{ timingSrcPosCurr }} -->
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
    intervalId: null, // This variable is used for the id of two different intervals. They are never active at the same time, still probably not ideal though.
    // hostUrl: 'http://sadiss.test.test',
    // hostUrl: 'http://8hz.at',
    hostUrl: 'https://sadiss.net',
    print: '',
    timingProvider: null,
    timingObj: null,
    currentVel: 0,
    timingSrcPosCurr: null,
    hasStarted: false,
    timingSetupDone: false,
    beep: null
  }),
  async mounted () {
    // this.timingProvider = new TimingProvider('ws://192.168.0.87:2276');
    this.timingProvider = new TimingProvider('ws://sadiss.net:2276');
    this.timingObj = new TimingObject(this.timingProvider)

    // this.beep = new Audio("data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=")

    // this.timingObj.update({ velocity: 1 })

    /* Possible functions to use */
    // requestAnimationFrame(function updateUI(_this) {
    //   if(this.timingObj.query().velocity !== this.currentVel) {
    //     this.currentVel = this.timingObj.query().velocity
    //     console.log(this.currentVel)
    //   }
    //   requestAnimationFrame(updateUI(this));
    // });

    // this.timingObj.on('timeupdate', () => {
    //   if(this.timingObj.query().velocity !== this.currentVel) {
    //     this.currentVel = this.timingObj.query().velocity
    //     console.log(this.currentVel)
    //   }
    // })

    // Fetch tracks
    const res = await fetch (this.hostUrl + '/api/track')
    const json = await res.json()
    this.availableTracks = json

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
      if (this.timingObj.query().velocity !== 1) {
        this.timingObj.update({ velocity: 1 })
        console.log("Set TimingObject velocity to 1.")
      }
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

      // Check for start immediately, afterwards check in intervals of 1.5 seconds.
      await this.checkForStart();
      this.intervalId = window.setInterval(async () => {
        await this.checkForStart(data.token);
      }, 1500);
      this.isRegistered = true;

      // Start audio context.
      this.player.audioContext = new(window.AudioContext || window.webkitAudioContext)()
    },

    async checkForStart (token) {
      const response = await fetch(`${this.hostUrl}/api/client/${token}`)
      const clientData = await response.json()
      if (clientData.client['start_time']) {
        window.clearInterval(this.intervalId)
        this.startPrepAtPosition = clientData.client['start_time']
        this.partials = clientData.client['partials']
        if (!this.timingSetupDone) { // Prevent multiple calls of prepare() if checkForStart() short interval time
          this.prepare()
          this.timingSetupDone = true
        }
      }
      return clientData
    },

    prepare () {
      const startPrepAtPosition = Number(this.timingObj.query().position.toFixed(1)) + 3 // seconds
      console.log("Starting preparation at position: ", startPrepAtPosition)
      const intervalId = window.setInterval(() => {
        const q = this.timingObj.query()
        this.timingSrcPosCurr = q.position
        if (this.timingSrcPosCurr >= startPrepAtPosition) {
          console.log('Starting now. Position: ', this.timingSrcPosCurr)
          if (!this.hasStarted) {
            this.start()
            this.hasStarted = true
          }
          window.clearInterval(intervalId)
        }
      }, 2)
    },
    async start () {
      const startInSec = 2
      this.player.setup(this.partials, startInSec, this.player.audioContext.currentTime - this.timingSrcPosCurr / 1000)
      this.player.play()
      this.isRegistered = false;

      // Reregister when done
      // await this.register()
    },
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
