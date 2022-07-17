<template>
  <div class="app" v-if="motion">
    <!-- Only show if never registered this session and not currently registered -->
    <OutputLatencyCalibration v-if="!player.audioContext && !isRegistered" @calibrationFinished="calibrationFinished" :motion="motion" />

    <!-- Register -->
    <div id="register" class="md:w-1/2 w-11/12 p-4 flex flex-col justify-center items-center h-screen">
      <!-- Top -->
      <!-- Performance Id dropdown -->
      <select v-if="!isRegistered" v-model="performanceId" class="border p-2 rounded-full h-10 w-10 fixed top-5 right-5">
        <option v-for="performance of performances">{{ performance.id }}</option>
      </select>
      <!-- Current global time and other information -->
      <div class="fixed top-5 right-5">
        <p v-if="isRegistered">{{ timingSrcPosition }}</p>
        <p v-if="countdownTime > 0"
          style="display: flex; justify-content: center; font-size: 50px">
          {{ countdownTime }}
        </p>
        <p v-else-if="player && player.playing">Track currently playing.</p>
        <!-- <p v-else>Device not registered.</p> -->
        <div v-html="print" style="margin-top: 1rem" />
      </div>
      
      <!-- Center -->
      <button @click="register" id="registerBtn" class="border-2 p-2 mt-4 rounded-full h-28 w-28 transition-all duration-300">
        <span v-if="!isRegistered">Register</span>
        <span v-else>{{ deviceRegistrationId }}</span>
      </button>
    </div>

    <!-- Play track locally -->
    <!-- Currently hidden - display: none -->
    <div
      style="display: flex; flex-direction: column; justify-content: center; display: none"
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
  <!-- Loading Spinner while waiting for motion -->
  <div v-else class="flex justify-center items-center h-screen">
    <div class="lds-dual-ring" />
  </div>
</template>
<script>
/* global getOscillator */
import dayjs from "dayjs";
import dayjsPluginUTC from "dayjs/plugin/utc";
dayjs.extend(dayjsPluginUTC);

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
    deviceRegistrationId: null, // Only used in UI
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
    // Get performances to later check against performanceId URL paramater (if present) to make sure performance exists
    const performanceResponse = await fetch(this.hostUrl + "/api/performance")
    this.performances = await performanceResponse.json()

    this.initializeMCorp()

    // Fetch tracks
    const res = await fetch(this.hostUrl + "/api/track");
    this.availableTracks = await res.json();

    // Get URL parameters and set performanceId and partialId if present
    const params = new Proxy(new URLSearchParams(window.location.search), {
      get: (searchParams, prop) => searchParams.get(prop),
    });
    if (this.performances.map(p => p.id).includes(Number(params.id))) {
      this.performanceId = Number(params.id)
    }
    this.partialIdToRegisterWith = params.partial_id

    // Try to get previously set output latency from local storage
    this.outputLatencyFromLocalStorage = Number(localStorage.getItem("outputLatency"));

    // Initialize player
    this.player = new Player()
  },
  methods: {
    async initializeMCorp () {
      const mCorpApp = MCorp.app(import.meta.env.VITE_MCORP_API_KEY, {anon: true})
      mCorpApp.run = () => {
        this.motion = mCorpApp.motions['shared']
      }
      mCorpApp.init()
      while (!this.motion) {
        await new Promise(r => setTimeout(r, 500));
      }
    },

    async register () {
      if (this.isRegistered) {
        window.clearInterval(this.invervalId)
        this.isRegistered = false
        return
      }

      if (!this.performanceId) {
        alert("Select a performance id.")
        return
      }

      // Synthesize voice (with volume set to 0) on registration to make TTS work on iOS
      const initialUtterance = new SpeechSynthesisUtterance('You are now registered.')
      initialUtterance.volume = 0
      speechSynthesis.speak(initialUtterance)

      this.initialTimingSrcIntervalId = window.setInterval(() => {
        this.timingSrcPosition = this.motion.pos.toFixed(1)
      }, 10);

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
        await this.checkForStart(data.token);
      }, 1000);
      
      this.isRegistered = true;
      this.blink()
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
        window.clearInterval(this.intervalId);
        const startTimeFromServer = Number(clientData.client["start_time"]);
        this.ttsInstructions = JSON.parse(clientData.client["tts_instructions"])
        console.log("Parsed instructions: ", this.ttsInstructions)
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

        window.clearInterval(this.initialTimingSrcIntervalId);
        const intervalId = window.setInterval(() => {
          this.timingSrcPosition = this.globalTime();
          if (this.timingSrcPosition >= startTimeFromServer + 3) {
            this.print += this.timingSrcPosition + '\n'
            console.log(this.timingSrcPosition)
            this.player.offset =
              this.timingSrcPosition - this.player.audioContext.currentTime; // Do not change!
            // Prevent multiple calls of prepare() if checkForStart() short interval time
            if (!prepareStarted) {
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

        console.log("ttsTimestamps: ", ttsTimestamps)
  
        let nextTimestamp = ttsTimestamps.shift()
        let nextUtterance
        if (this.partialIdToRegisterWith) {
          nextUtterance = new SpeechSynthesisUtterance(this.ttsInstructions[nextTimestamp][this.partialIdToRegisterWith][this.ttsLanguage])
        } else {
          nextUtterance = new SpeechSynthesisUtterance(this.ttsInstructions[nextTimestamp][this.ttsLanguage])
        }
        nextUtterance.lang = this.ttsLanguage

        const speechIntervalId = window.setInterval(() => {
          if (this.globalTime() - this.player.offset >= now + Number(nextTimestamp) + startInSec) {
            speechSynthesis.speak(nextUtterance)
            if (ttsTimestamps.length) {
              nextTimestamp = ttsTimestamps.shift()
              if (this.partialIdToRegisterWith) {
                nextUtterance = new SpeechSynthesisUtterance(this.ttsInstructions[nextTimestamp][this.partialIdToRegisterWith][this.ttsLanguage])
              } else {
                nextUtterance = new SpeechSynthesisUtterance(this.ttsInstructions[nextTimestamp][this.ttsLanguage])
              }
              nextUtterance.lang = this.ttsLanguage
            } else {
              window.clearInterval(speechIntervalId)
            }
          }
        }, 50)
      }
      
      /* END OF TEXT TO SPEECH TESTING */
    },

    calibrationFinished (e) {
      this.outputLatencyFromLocalStorage = Number(e.calibratedLatency)
      const registerDiv = document.getElementById("register");
      registerDiv.scrollIntoView({ behavior: 'smooth' });
    },

    blink () {
      const btn = document.getElementById('registerBtn')
      if (this.isRegistered || btn.style.borderColor !== 'white') {
        btn.style.borderColor = btn.style.borderColor !== 'white' ? 'white' : '#FF6700'
        window.setTimeout(() => {
          this.blink()
        }, 1000)
      }
      
    },

    async playLocally() {
      const res = await fetch(`${this.hostUrl}/api/track/${this.trackId}`);
      const data = await res.json();
      this.partialData = JSON.parse(data.partials);
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

/* Large loading spinner */
/* https://loading.io/css/ */
.lds-dual-ring {
  display: inline-block;
  width: 80px;
  height: 80px;
}
.lds-dual-ring:after {
  content: " ";
  display: block;
  width: 64px;
  height: 64px;
  margin: 8px;
  border-radius: 50%;
  border: 6px solid #fff;
  border-color: #EEE transparent #EEE transparent;
  animation: lds-dual-ring 1.2s linear infinite;
}
@keyframes lds-dual-ring {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
