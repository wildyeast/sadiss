<template>
  <div class="app">
    <OutputLatencyCalibration @calibrationFinished="calibrationFinished"/>
    <!-- <button @click="startStop">Start/Stop</button> -->
    <div class="md:w-1/2 w-11/12 border b-white p-4 flex flex-col">
      Calibrated output latency: {{ outputLatencyFromLocalStorage }}
      <select v-model="performanceId">
        <option v-for="performance of performances">{{ performance.id }}</option>
      </select>
      <div class="flex items-center">
        <input
          type="checkbox"
          v-model="useCalculatedOutputLatency"
          class="mr-4"
        />
        <label for="">Use calculated output latency</label>
      </div>
      <button @click="register" class="border b-white p-2 mt-4">
        Register
      </button>
      {{ timingSrcPosition }}
      <div class="mt-4">
        <p
          v-if="countdownTime > 0"
          style="display: flex; justify-content: center; font-size: 50px"
        >
          {{ countdownTime }}
        </p>
        <p v-else-if="player && !player.playing && isRegistered">
          Device registered with ID {{ deviceRegistrationId }}. Waiting for
          track start.
        </p>
        <p v-else-if="player && player.playing">Track currently playing.</p>
        <p v-else>Device not registered.</p>
        <div v-html="print" style="margin-top: 1rem" />
      </div>
    </div>
    <div
      style="display: flex; flex-direction: column; justify-content: center"
      class="md:w-1/2 w-11/12 border b-white p-4"
    >
      <p>
        Select a track ID from the dropdown below and press Play to prepare the
        selected track. All partials will be played on this device. The ID
        corresponds to the tracks's ID in the database (check the
        <a :href="hostUrl + '/tracks'">Admin Interface</a> for a list of
        available tracks). If the dropdown is empty, add a track to the database
        via the Admin Interface and afterwards refresh this page.
      </p>
      <div class="flex flex-row justify-between items-center py-4">
        <label>Select a track ID</label>
        <select v-model="trackId">
          <option v-for="track of availableTracks" :key="track.id">
            {{ track.id }} - {{ track.title }}
          </option>
        </select>
        <button
          v-if="player && !player.playing"
          @click="playLocally"
          class="border b-white p-2"
        >
          Play
        </button>
        <button v-else @click="player.stop" class="border b-white p-2">
          Stop
        </button>
      </div>
    </div>
  </div>
</template>
<script>
/* global getOscillator */
import dayjs from "dayjs";
import dayjsPluginUTC from "dayjs/plugin/utc";
dayjs.extend(dayjsPluginUTC);
import {TimingObject, TimingSampler, TimingProgress } from "https://webtiming.github.io/timingsrc/lib/timingsrc-esm-v3.js";

import Player from "./Player";
import OutputLatencyCalibration from './components/OutputLatencyCalibration.vue'

export default {
  name: "App",
  components: { OutputLatencyCalibration },
  data: () => ({
    player: null,
    partials: null,
    countdownTime: -1,
    
    isRegistered: false,
    trackId: 1,
    availableTracks: [],
    deviceRegistrationId: null,
    intervalId: null,
    // hostUrl: "http://sadiss.test.test",
    // hostUrl: 'http://8hz.at',
    hostUrl: "https://sadiss.net",
    print: "",
    timingProvider: null,
    timingObj: null,
    timingSrcPosition: null,
    ttsInstructions: null,
    ttsLanguage: null,
    offset: null,
    time: 0,
    initialTimingSrcIntervalId: null,
    audio: null,

    clients: [],

    outputLatency: 0,
    useCalculatedOutputLatency: true,
    motion: null,
    performanceId: 1,
    performances: null,
    ttsInstructions: null,
    ttsLanguage: null,
    partialIdToRegisterWith: null,
    waveform: null,
    print: '',
    outputLatencyFromLocalStorage: null
  }),
  async mounted() {
    const performanceResponse = await fetch(this.hostUrl + "/api/performance")
    this.performances = await performanceResponse.json()

    const mCorpApp = MCorp.app("8844095860530063641", {anon: true})
    mCorpApp.run = () => {
      this.motion = mCorpApp.motions['shared']
    }
    mCorpApp.init()
    while (!this.motion) {
      await new Promise(r => setTimeout(r, 500));
    }
    // this.motion.update(null, 1, null)
    this.player = new Player();
    // Fetch tracks
    const res = await fetch(this.hostUrl + "/api/track");
    this.availableTracks = await res.json();

    const params = new Proxy(new URLSearchParams(window.location.search), {
      get: (searchParams, prop) => searchParams.get(prop),
    });

    if (this.performances.map(p => p.id).includes(Number(params.id))) {
      this.performanceId = Number(params.id)
    }

    this.partialIdToRegisterWith = params.partial_id

    this.outputLatencyFromLocalStorage = Number(localStorage.getItem("outputLatency"));
  },
  methods: {
    startStop () {
      if (this.motion.vel === 1) {
        this.motion.update(0, 0, null)
      } else {
        this.motion.update(null, 1, null)
        // this.to.update({velocity:1});
      }
    },

    async register() {
      if (this.isRegistered) return;

      if (!this.performanceId) {
        alert("Select a performance id.")
        return
      }

      while (!this.motion) {
        await new Promise(r => setTimeout(r, 500));
      }

      this.initialTimingSrcIntervalId = window.setInterval(() => {
        this.timingSrcPosition = this.motion.pos.toFixed(1)
        // console.log(this.timingSrcPosition)
      }, 10);
      // this.timingObj.onchange = (e) => {
      //   console.log("Global TimeObject onchange event triggered.");
      // };

      // Initialize player
      this.player = new Player();
      // Pass over register function from this file to player
      this.player.registerFunction = this.register;

      const audioCtx = window.AudioContext || window.webkitAudioContext;
      // Start audio context.
      this.player.audioContext = new audioCtx({
        latencyHint: 0,
        // sampleRate: 31000,
      });
      // This is necessary to make the audio context work on iOS.
      this.player.audioContext.resume()

      const response = await fetch(this.hostUrl + "/api/client/create", {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ performance_id: this.performanceId, partial_id: this.partialIdToRegisterWith }),
      });
      const data = await response.json();
      this.deviceRegistrationId = data.id; // Only used in UI.

      // Check for start immediately, afterwards check in intervals of 1 second.
      await this.checkForStart(data.token);
      this.intervalId = window.setInterval(async () => {
        // console.log(this.timingObj.query().position)
        await this.checkForStart(data.token);
      }, 1000);
      this.isRegistered = true;
    },

    async checkForStart(token) {
      const response = await fetch(`${this.hostUrl}/api/client/${token}`);
      if (response.status === 404) {
        console.log("Client removed via Admin Interface");
        this.isRegistered = false;
        window.clearInterval(this.intervalId);
        return;
      }
      const clientData = await response.json();
      if (clientData.client["start_time"]) {
        console.log(
          "Start time from server: ",
          clientData.client["start_time"]
        );
        window.clearInterval(this.intervalId);
        const startTimeFromServer = Number(clientData.client["start_time"]);
        this.ttsInstructions = JSON.parse(clientData.client["tts_instructions"])
        this.ttsLanguage = clientData.client["tts_language"]
        const wf = clientData.client["waveform"]
        if (wf) {
          if (['sine', 'sawtooth', 'square', 'triangle'].includes(wf)) {
            this.player.waveform = wf
          } else {
            // TODO: Placeholder for custom wave
            // Since you can't enter custom waves in the admin interface currently this is not implemented.
          }
        }

        // Conversion only necessary if playing from chunks sent by db, not when playing all partials on one client directly
        this.partialData = this.convertPartialsIfNeeded(
          clientData.client["partials"]
        );
        this.player.partialData = this.partialData;

        let prepareStarted = false;
        // const sampler = new TimingSampler(to, {period:100});
        // MCorp.mediaSync(this.audio, this.to, { debug: true })

        window.clearInterval(this.initialTimingSrcIntervalId);
        const intervalId = window.setInterval(() => {
          this.timingSrcPosition = this.globalTime();
          if (this.timingSrcPosition >= startTimeFromServer + 3) {
            this.print += this.timingSrcPosition + '\n'
            // const a = document.querySelector('.app')
            // a.style['background-color'] = 'red'
            // this.audio.play()
            console.log(this.timingSrcPosition)
            this.player.offset =
              this.timingSrcPosition - this.player.audioContext.currentTime; // Do not change!
            // console.log("Offset: ", this.player.offset);
            if (!prepareStarted) {
              // Prevent multiple calls of prepare() if checkForStart() short interval time
              // a.style['background-color'] = 'blue'
              this.start();
              prepareStarted = true;
            }
            window.clearInterval(intervalId);
          }
        }, 1);
      }
      return clientData;
    },

    async start() {
      const startInSec = 5;
      const q = this.globalTime();
      const now = q - this.player.offset; // Do not change!
      
      const adjustedNow = now + this.outputLatencyFromLocalStorage
      console.log("LocalStorageOutputLatency: ", this.outputLatencyFromLocalStorage)
      console.log("Adjusted Now: ", adjustedNow)
      console.log("Diff: ", adjustedNow - now)

      this.player.setup(
        this.partialData,
        startInSec,
        // now - calculatedOutputLatency - this.player.audioContext.baseLatency // O
        // now // no O
        // now - latencyToSubtract // O only on Chrome
        now + this.outputLatencyFromLocalStorage
      );
      this.isRegistered = false;

      /* TEXT TO SPEECH TESTING */

      console.log(this.ttsInstructions, this.ttsLanguage)

      if (this.ttsInstructions && this.ttsLanguage) {
        console.log("Starting TTS.")
        const ttsTimestamps = Object.keys(this.ttsInstructions)
  
        let nextTimestamp = ttsTimestamps.shift()
        let nextUtterance = new SpeechSynthesisUtterance(this.ttsInstructions[nextTimestamp][this.ttsLanguage])
        nextUtterance.lang = this.ttsLanguage

        const speechIntervalId = window.setInterval(() => {
          if (this.globalTime() - this.player.offset >= now + Number(nextTimestamp) + startInSec) {
            speechSynthesis.speak(nextUtterance)
            console.log("AudioCtx time + offset: ", this.player.audioContext.currentTime + this.player.offset)
            if (ttsTimestamps.length) {
              nextTimestamp = ttsTimestamps.shift()
              nextUtterance = new SpeechSynthesisUtterance(this.ttsInstructions[nextTimestamp][this.ttsLanguage])
              nextUtterance.lang = this.ttsLanguage
            } else {
              window.clearInterval(speechIntervalId)
            }
          }
        }, 50)
      }
      
      /* END OF TEXT TO SPEECH TESTING */

      // Reregister when done
      // await this.register()
    },

    calibrationFinished (e) {
      this.outputLatencyFromLocalStorage = Number(e.calibratedLatency)
      console.log(this.outputLatencyFromLocalStorage)
    },

    async playLocally() {
      const res = await fetch(`${this.hostUrl}/api/track/${this.trackId}`);
      const data = await res.json();
      this.partialData = JSON.parse(data.partials);
      // console.log(this.partials);
      if (!this.player.audioContext) {
        this.player.audioContext = new AudioContext();
      }
      this.player.setup(this.partialData, 0, 0, true);
    },

    globalTime() {
      return this.motion.pos;
    },

    convertPartialsIfNeeded(partialData) {
      let partials;
      if (typeof partialData === "string") {
        let json = JSON.parse(partialData);
        partials = json.reverse();
      } else {
        partials = partialData;
      }
      return partials;
    },
  },
};
</script>
<style>
html,
body {
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
