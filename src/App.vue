<script setup lang="ts">
import NoSleep from 'nosleep.js';
import Player from "./Player"
import OutputLatencyCalibration from './components/OutputLatencyCalibration.vue'
import { onMounted, Ref, ref } from "vue"
import { ChoirTtsInstructions, SequencerTtsInstructions } from "./types";

const availableTracks: Ref<{ id: number, title: string }[]> = ref([])
const countdownTime = ref(-1)
const deviceRegistrationId = ref(-1) // Only used in UI
const hasCalibratedThisSession = ref(false)
// const hostUrl = "http://sadiss.test/v1"
const hostUrl = "https://sadiss.net/api/v1"
let intervalId: number
let initialTimingSrcIntervalId: number
const isRegistered = ref(false)
const motion: Ref<{ pos: number }> = ref({ pos: 0 })
const motionConnected = ref(false)
let outputLatencyFromLocalStorage: number
let partialData: []
let partialIdToRegisterWith: number | null
let performanceId = ref(1)
let performances = ref()
const player: Ref<Player> = ref(new Player())
let print = ''
let timingSrcPosition: Ref<number> = ref(-1)
let trackId = ref(1)
let ttsInstructions: null
const ttsLanguage = ref('en-US')
let noSleep: NoSleep
let noSleepEnabled = false

onMounted(async () => {

  // If client loses focus (lock screen, tab switch, etc), stop playback.
  // Especially necessary for iOS. There, script execution gets suspended on screen lock,
  // and resumed on unlock, leading to desync between devices.
  // document.addEventListener('visibilitychange', () => {
  //   if (document['hidden']) {
  //     if (player.value.playing) {
  //       player.value.stop()
  //       player.value.playing = false
  //     }
  //   }
  // }, false)

  // Get performances to later check against performanceId URL paramater (if present) to make sure performance exists
  const performanceResponse = await fetch(hostUrl + '/performance')
  performances.value = await performanceResponse.json()

  // Get URL parameters and set performanceId and partialId if present
  const params = new URLSearchParams(window.location.search)
  if (performances.value.map((p: any) => p.id).includes(Number(params.get('id')))) {
    performanceId.value = Number(params.get('id'))
  }
  if (params.get('partial_id')) {
    partialIdToRegisterWith = Number(params.get('partial_id'))
  }

  initializeMCorp()

  // Fetch tracks
  const res = await fetch(hostUrl + '/track')
  availableTracks.value = await res.json()


  // Try to get previously set output latency from local storage
  outputLatencyFromLocalStorage = Number(localStorage.getItem("outputLatency"))
})

const initializeMCorp = async () => {
  // @ts-ignore: Can't find type for MCorp, which is added via <script> in index.html
  const mCorpApp = MCorp.app(import.meta.env.VITE_MCORP_API_KEY, { anon: true })
  mCorpApp.run = () => {
    motion.value = mCorpApp.motions['shared']
    motionConnected.value = true
  }
  mCorpApp.init()
  while (!motion) {
    await new Promise(r => setTimeout(r, 500))
  }
}

const register = async () => {
  // if (noSleepEnabled) {
  //   noSleep.disable()
  //   noSleepEnabled = false
  // }

  if (isRegistered.value) {
    window.clearInterval(intervalId)
    isRegistered.value = false
    return
  }

  if (!player.value) return

  if (!performanceId.value) {
    alert("Select a performance id.")
    return
  }


  // Resume audioCtx for iOS
  await player.value.audioContext.resume()

  // Synthesize voice (with volume set to 0) on registration to make TTS work on iOS
  const initialUtterance = new SpeechSynthesisUtterance('You are currentGlobalTimeInCtxTime registered.')
  initialUtterance.volume = 0
  speechSynthesis.speak(initialUtterance)

  initialTimingSrcIntervalId = window.setInterval(() => {
    timingSrcPosition.value = Number(motion.value.pos.toFixed(1))
  }, 10)

  // Pass over register function from this file to player
  player.value.register = register

  if (!player.value.audioContext) {
    const audioCtx = window.AudioContext || window.webkitAudioContext
    // Start audio context.
    player.value.audioContext = new audioCtx({
      latencyHint: 0,
      // sampleRate: 31000,
    })
    // This is necessary to make the audio context work on iOS.
    player.value.audioContext.resume()
  }

  if (!noSleepEnabled) {
    noSleep = new NoSleep()
    await noSleep.enable()
    noSleepEnabled = true
  }

  const response = await fetch(hostUrl + '/client/create', {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ performance_id: performanceId.value, partial_id: partialIdToRegisterWith }),
  })
  const data = await response.json()
  deviceRegistrationId.value = data.id // Only used in UI.

  // Check for start immediately, afterwards check in intervals of 1 second.
  await checkForStart(data.token)
  intervalId = window.setInterval(async () => {
    await checkForStart(data.token)
  }, 1000)

  isRegistered.value = true
  blink()
}

const checkForStart = async (token: string) => {
  const response = await fetch(`${hostUrl}/client/${token}`)
  if (response.status === 404) {
    console.log("Client removed via Admin Interface")
    isRegistered.value = false
    window.clearInterval(intervalId)
    return
  }

  const clientData = await response.json()
  if (clientData.client["start_time"]) {
    console.log('Client data: ', clientData)
    window.clearInterval(intervalId)
    const startTimeFromServer = Number(clientData.client["start_time"])
    ttsInstructions = JSON.parse(clientData.client["tts_instructions"])

    const wf = clientData.client["waveform"]
    if (wf) {
      if (['sine', 'sawtooth', 'square', 'triangle'].includes(wf)) {
        player.value.waveform = wf
      } else {
        // TODO: Placeholder for custom wave
        // Since you can't enter custom waves in the admin interface currently this is not implemented.
      }
    }

    // Conversion only necessary if playing from chunks sent by db, not when playing all partials on one client directly
    partialData = convertPartialsIfNeeded(
      clientData.client["partials"]
    )
    player.value.partialData = partialData

    let prepareStarted = false

    window.clearInterval(initialTimingSrcIntervalId)
    intervalId = window.setInterval(() => {
      timingSrcPosition.value = motion.value.pos
      if (timingSrcPosition.value >= startTimeFromServer + 3) {
        print += timingSrcPosition.value + '\n'
        console.log(timingSrcPosition)
        player.value.offset =
          timingSrcPosition.value - player.value.audioContext.currentTime // Do not change!
        // Prevent multiple calls of prepare()
        if (!prepareStarted) {
          start()
          prepareStarted = true
        }
        window.clearInterval(intervalId)
      }
    }, 1)
  }
  return clientData
}

const start = async () => {
  const startInSec = 5
  // const currentGlobalTimeInCtxTime = motion.value.pos - player.value.offset // Do not change!

  player.value.setup(
    partialData,
    startInSec,
    motion.value,
    outputLatencyFromLocalStorage
  )

  isRegistered.value = false

  /* TEXT TO SPEECH */
  if (ttsInstructions && ttsLanguage.value) {
    const ttsTimestamps = Object.keys(ttsInstructions).map(timestamp => Number(timestamp))

    let nextTimestamp = ttsTimestamps.shift()

    // === undefined needed since it can be 0
    if (!(typeof nextTimestamp === 'number')) return

    let nextUtterance: SpeechSynthesisUtterance | null

    if (typeof partialIdToRegisterWith === 'number') {
      nextUtterance = createChoirUtterance(ttsInstructions, nextTimestamp, ttsLanguage.value, partialIdToRegisterWith)
    } else {
      nextUtterance = createSequencerUtterance(ttsInstructions, nextTimestamp, ttsLanguage.value)
    }

    const speechIntervalId = window.setInterval(() => {
      if (motion.value.pos - player.value.offset >= motion.value.pos - player.value.offset + Number(nextTimestamp) + startInSec) {
        if (nextUtterance) {
          speechSynthesis.speak(nextUtterance)
          nextUtterance = null
        }
        if (ttsInstructions && ttsTimestamps.length) {
          nextTimestamp = Number(ttsTimestamps.shift())
          if (!nextTimestamp) return
          if (typeof partialIdToRegisterWith === 'number') {
            nextUtterance = createChoirUtterance(ttsInstructions, nextTimestamp, ttsLanguage.value, partialIdToRegisterWith)
          } else {
            nextUtterance = createSequencerUtterance(ttsInstructions, nextTimestamp, ttsLanguage.value)
          }
        } else {
          window.clearInterval(speechIntervalId)
        }
      }
    }, 50)
  }

  /* END OF TEXT TO SPEECH */
}

const createSequencerUtterance = (ttsInstructions: SequencerTtsInstructions, nextTimestamp: number, ttsLanguage: string): SpeechSynthesisUtterance | null => {
  console.log('Creating sequencer utterance.')
  let utterance: SpeechSynthesisUtterance | null = null;
  if (ttsInstructions[nextTimestamp][ttsLanguage]) {
    utterance = new SpeechSynthesisUtterance(ttsInstructions[nextTimestamp][ttsLanguage])
    utterance.lang = ttsLanguage
  }
  return utterance
}

const createChoirUtterance = (ttsInstructions: ChoirTtsInstructions, nextTimestamp: number, ttsLanguage: string, partialIdToRegisterWith: number): SpeechSynthesisUtterance | null => {
  console.log('Creating choir utterance.')
  let utterance: SpeechSynthesisUtterance | null = null;
  if (ttsInstructions[nextTimestamp][partialIdToRegisterWith]
    && ttsInstructions[nextTimestamp][partialIdToRegisterWith][ttsLanguage]) {
    utterance = new SpeechSynthesisUtterance(ttsInstructions[nextTimestamp][partialIdToRegisterWith][ttsLanguage])
    utterance.lang = ttsLanguage
  }
  return utterance
}

const calibrationFinished = (calibratedLatency: number) => {
  outputLatencyFromLocalStorage = Number(calibratedLatency)
  const registerDiv = document.getElementById("register")
  registerDiv?.scrollIntoView({ behavior: 'smooth' })
  hasCalibratedThisSession.value = true
}

const blink = () => {
  const btn = document.getElementById('registerBtn')
  if (btn && (isRegistered.value || btn?.style.borderColor !== 'white')) {
    btn.style.borderColor = btn.style.borderColor !== 'white' ? 'white' : '#FF6700'
    window.setTimeout(() => {
      blink()
    }, 1000)
  }
}

const playLocally = async () => {
  // Resume audioCtx for iOS
  player.value.audioContext.resume()

  const partialData = await fetch(`${hostUrl}/track/${trackId.value}`)
    .then(res => res.json())
    .then(data => JSON.parse(data.partials))
  player.value.setup(partialData, 0, 0, outputLatencyFromLocalStorage)
}

const convertPartialsIfNeeded = (partialData: string | object) => {
  let partials
  if (typeof partialData === "string") {
    let json = JSON.parse(partialData)
    partials = json.reverse()
  } else {
    partials = partialData
  }
  return partials
}
</script>

<template>
  <div class="app"
       v-if="motionConnected">
    <!-- Only show if never registered this session and not currently registered -->
    <OutputLatencyCalibration v-if="player && !hasCalibratedThisSession && !isRegistered"
                              @calibrationFinished="calibrationFinished"
                              :motion="motion" />

    <!-- Register -->
    <div id="register"
         class="md:w-1/2 w-11/12 p-4 flex flex-col justify-center items-center h-screen">

      <!-- Top -->
      <!-- Performance Id dropdown -->
      <select v-if="!isRegistered && !player.playing"
              v-model="performanceId"
              class="border p-2 rounded-full h-10 w-10 fixed top-5 right-5">
        <option v-for="performance of performances">{{ performance.id }}</option>
      </select>
      <!-- Current global time and other information -->
      <div class="fixed top-5 right-5">
        <p v-if="isRegistered">{{ timingSrcPosition }}</p>
        <p v-if="countdownTime > 0"
           style="display: flex justify-content: center font-size: 50px">
          {{ countdownTime }}
        </p>
        <p v-else-if="player && player.playing">Track currently playing.</p>
        <!-- <p v-else>Device not registered.</p> -->
        <div v-html="print"
             style="margin-top: 1rem" />
      </div>

      <!-- Center -->
      <select v-model="ttsLanguage">
        <option value="en-US">en-US</option>
        <option value="de-DE">de-DE</option>
      </select>
      <button @click="register"
              id="registerBtn"
              class="border-2 p-2 mt-4 rounded-full h-28 w-28 transition-all duration-300">
        <span v-if="!isRegistered">Register</span>
        <span v-else>{{ deviceRegistrationId }}</span>
      </button>
    </div>

    <!-- Play track locally -->
    <!-- Currently hidden - display: none -->
    <div style="display: flex; flex-direction: column; justify-content: center; display:none;"
         class="md:w-1/2 w-11/12 border b-white p-4">
      <p>
        Select a track ID from the dropdown below and press Play to prepare the
        selected track. All partials will be played on this device. The ID
        corresponds to the tracks's ID in the database (check the
        <a :href="hostUrl + 'tracks'">Admin Interface</a> for a list of
        available tracks). If the dropdown is empty, add a track to the database
        via the Admin Interface and afterwards refresh this page.
      </p>
      <div class="flex flex-row justify-between items-center py-4">
        <label>Select a track ID</label>
        <select v-model="trackId">
          <option v-for="track of availableTracks"
                  :key="track.id">
            {{ track.id }} - {{ track.title }}
          </option>
        </select>
        <button v-if="player && !player.playing"
                @click="playLocally"
                class="border b-white p-2">
          Play
        </button>
        <button v-else
                @click="player?.stop"
                class="border b-white p-2">
          Stop
        </button>
      </div>
    </div>
  </div>
  <!-- Loading Spinner while waiting for motion -->
  <div v-else
       class="flex justify-center items-center h-screen">
    <div class="lds-dual-ring" />
  </div>
</template>

<style>
html,
body {
  background-color: black
}

.app {
  font-family: monospace;
  font-size: 1.1em;
  display: flex;
  flex-flow: column;
  align-items: center;
  overflow: hidden;
  color: white;
}

/* Large loading spinner */
/* https://loading.io/css/ */
.lds-dual-ring {
  display: inline-block;
  width: 80px;
  height: 80px
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
  animation: lds-dual-ring 1.2s linear infinite
}

@keyframes lds-dual-ring {
  0% {
    transform: rotate(0deg)
  }

  100% {
    transform: rotate(360deg)
  }
}
</style>
