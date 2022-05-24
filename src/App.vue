<template>
  <div class="app">
    <button @click="startStop">Start/Stop</button>
    <div class="md:w-1/2 w-11/12 border b-white p-4 flex flex-col">
      <!-- <p>
        Press Register below to register this device to receive partials when
        'Start track' is pressed in the track details page of a track in the
        Admin Interface. The registration ID of the device displayed after
        pressing Register will be visible in the list of registered clients in
        the track details page in the Admin Interface. This ID changes with
        every registration.
      </p> -->
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
import { TimingProvider } from "timing-provider";
import { TimingObject } from "timing-object";
import * as TIMINGSRC from "timingsrc";
// import * as MCorp from "./MotionCorp.js"

import Player from "./Player";

export default {
  name: "App",
  components: {},
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
    offset: null,
    time: 0,
    initialTimingSrcIntervalId: null,
    audio: null,

    clients: [],

    userAgentOffset: 0,
    outputLatency: 0,
    // useCalculatedOutputLatency: false, // Use this line when sniffing user agent in mounted
    useCalculatedOutputLatency: true,
    motion: null
  }),
  async mounted() {

    const mCorpApp = MCorp.app("1838773087003283590")
    mCorpApp.run = () => {
      this.motion = mCorpApp.motions['shared']
    }
    mCorpApp.init()
    
    while (!this.motion) {
      await new Promise(r => setTimeout(r, 500));
    }
    this.motion.update(null, 1, null)

    // window.setInterval(() => {
    //   console.log(this.motion.query().pos)
    // }, 5)

    // this.motion.on("change", () => {
    //   console.log("Stopped at: ", this.motion.query().pos)
    // })

    // window.setTimeout(() => {
    //   console.log(this.motion.query().pos)
    //   this.motion.update(null, 0, null)
    //   console.log(this.motion.query().pos)
    // }, 3000)


    // const userAgent = window.navigator.userAgent;
    // if (userAgent.includes("Mobile") && userAgent.includes("Chrome")) {
    //   // this.userAgentOffset = -0.3;
    //   this.useCalculatedOutputLatency = true;
    // }
    // console.log(userAgent);
    // console.log("userAgentOffset: ", this.userAgentOffset);

    this.player = new Player();

    // this.timingProvider = new TimingProvider('wss://sadiss.net/zeitquelle');
    // this.timingProvider.onreadystatechange = () => {
    //   if (this.timingProvider.readyState === "open") {
    //     this.timingObj = new TimingObject(this.timingProvider);
    //   }
    // }

    // Fetch tracks
    const res = await fetch(this.hostUrl + "/api/track");
    this.availableTracks = await res.json();
  },
  methods: {
    startStop () {
      this.motion.update(null, 0, null)
      console.log(this.motion)
    },

    async register() {
      if (this.isRegistered) return;

      this.initialTimingSrcIntervalId = window.setInterval(() => {
        this.timingSrcPosition = this.motion.pos.toFixed(1)
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
      console.log("AudioCtx: ", this.player.audioContext);

      const response = await fetch(this.hostUrl + "/api/client/create", {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ performance_id: 1 }),
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
        // Conversion only necessary if playing from chunks sent by db (I think), not when playing all partials on one client directly
        this.partialData = this.convertPartialsIfNeeded(
          clientData.client["partials"]
        );
        this.player.partialData = this.partialData;

        let prepareStarted = false;

        window.clearInterval(this.initialTimingSrcIntervalId);
        const intervalId = window.setInterval(() => {
          this.timingSrcPosition = this.globalTime();
          if (this.timingSrcPosition >= startTimeFromServer) {
            this.player.offset =
              this.timingSrcPosition - this.player.audioContext.currentTime; // Do not change!
            console.log("Offset: ", this.player.offset);
            if (!prepareStarted) {
              // Prevent multiple calls of prepare() if checkForStart() short interval time
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
      // const ctxTime = this.player.audioContext.currentTime
      const now = q - this.player.offset; // Do not change!
      // const now = q - this.player.offset + this.userAgentOffset // With sniffed offset estimation
      this.player.playOneShot(now);
      console.log("ctx.baseLatency: ", this.player.audioContext.baseLatency);
      console.log(
        "ctx outputTimestamp ctx timestamp + offset:, ",
        this.player.audioContext.getOutputTimestamp().contextTime +
          this.player.offset
      );
      // console.log("ZQ - ctxTime - offset (should be 0): ", q - ctxTime - this.player.offset)
      // console.log(
      //   "ctx output latency: ",
      //   this.player.audioContext.outputLatency
      // );

      const calculatedOutputLatency =
        this.player.audioContext.currentTime -
        this.player.audioContext.getOutputTimestamp().contextTime;
      console.log("Calculated output latency: ", calculatedOutputLatency);

      const latencyToSubtract = this.useCalculatedOutputLatency
        ? calculatedOutputLatency - this.player.audioContext.baseLatency
        : 0;

      console.log("Latency to subract: ", latencyToSubtract);

      this.player.setup(
        this.partialData,
        startInSec,
        // now - calculatedOutputLatency - this.player.audioContext.baseLatency // O
        // now // no O
        now - latencyToSubtract // O only on Chrome
      );
      console.log(
        "ctxTime + offset when setup finished: ",
        this.player.audioContext.currentTime + this.player.offset
      );
      console.log(
        this.player.valuesSetForFirstPartial.map(
          (val) => val.map(v => v + this.player.offset)
        )
      );
      this.isRegistered = false;

      // Reregister when done
      // await this.register()
    },

    async playLocally() {
      const res = await fetch(`${this.hostUrl}/api/track/${this.trackId}`);
      const data = await res.json();
      this.partialData = JSON.parse(data.partials);
      console.log(this.partials);
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
    createClient() {
      class Client {
        pos = 0;
        constructor() {
          const timingProvider = new TimingProvider(
            "wss://sadiss.net/zeitquelle"
          );
          const timingObj = new TimingObject(timingProvider);
          window.setTimeout(() => {}, 5000);
          window.setInterval(() => {
            this.pos = timingObj.query().position;
          }, 2);
        }
      }
      return new Client();
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
