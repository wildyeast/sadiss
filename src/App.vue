<script setup lang="ts">
import Player from "./Player"
import OutputLatencyCalibration from './components/OutputLatencyCalibration.vue'
import { onMounted, Ref, ref } from "vue"

const availableTracks: Ref<{ id: number, title: string }[]> = ref([])
const countdownTime = ref(-1)
const deviceRegistrationId = ref(-1) // Only used in UI
const hasCalibratedThisSession = ref(false)
// const hostUrl = "http://sadiss.test/v1"
const hostUrl = "https://sadiss.org/api/v1"
let intervalId: number
let initialTimingSrcIntervalId: number
const isRegistered = ref(false)
const motion: Ref<{ pos: number }> = ref({ pos: 0 })
const motionConnected = ref(false)
let outputLatencyFromLocalStorage: number
let partialData: []
let partialIdToRegisterWith: number | null
let performanceId = 1
let performances: { id: number }[]
const player: Ref<Player> = ref(new Player())
let print = ''
let timingSrcPosition: Ref<number> = ref(-1)
let trackId = ref(1)
let ttsInstructions: null
let ttsLanguage: string

onMounted(async () => {
  // Get performances to later check against performanceId URL paramater (if present) to make sure performance exists
  const performanceResponse = await fetch(hostUrl + '/performance')
  performances = await performanceResponse.json()

  // Get URL parameters and set performanceId and partialId if present
  const params = new URLSearchParams(window.location.search)
  if (performances.map(p => p.id).includes(Number(params.get('id')))) {
    performanceId = Number(params.get('id'))
  }
  partialIdToRegisterWith = Number(params.get('partial_id'))

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
  if (isRegistered.value) {
    window.clearInterval(intervalId)
    isRegistered.value = false
    return
  }

  if (!player.value) return

  if (!performanceId) {
    alert("Select a performance id.")
    return
  }

  // Resume audioCtx for iOS
  player.value.audioContext.resume()

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

  const response = await fetch(hostUrl + '/client/create', {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ performance_id: performanceId, partial_id: partialIdToRegisterWith }),
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
    window.clearInterval(intervalId)
    const startTimeFromServer = Number(clientData.client["start_time"])
    ttsInstructions = JSON.parse(clientData.client["tts_instructions"])
    ttsLanguage = clientData.client["tts_language"]
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
  const currentGlobalTimeInCtxTime = motion.value.pos - player.value.offset // Do not change!

  player.value.setup(
    partialData,
    startInSec,
    currentGlobalTimeInCtxTime,
    outputLatencyFromLocalStorage
  )

  isRegistered.value = false

  /* TEXT TO SPEECH */
  if (ttsInstructions && ttsLanguage) {
    const ttsTimestamps = Object.keys(ttsInstructions)

    let nextTimestamp = ttsTimestamps.shift()
    if (!nextTimestamp) return

    let nextUtterance: SpeechSynthesisUtterance | null

    // TODO: Below is repeated once in the interval below. Refactor this!
    if (partialIdToRegisterWith !== null) {
      if (ttsInstructions[nextTimestamp][partialIdToRegisterWith]
        && ttsInstructions[nextTimestamp][partialIdToRegisterWith][ttsLanguage]) {
        nextUtterance = new SpeechSynthesisUtterance(ttsInstructions[nextTimestamp][partialIdToRegisterWith][ttsLanguage])
        nextUtterance.lang = ttsLanguage
      }
    } else {
      if (ttsInstructions[nextTimestamp][ttsLanguage]) {
        nextUtterance = new SpeechSynthesisUtterance(ttsInstructions[nextTimestamp][ttsLanguage])
        nextUtterance.lang = ttsLanguage
      }
    }

    const speechIntervalId = window.setInterval(() => {
      if (motion.value.pos - player.value.offset >= currentGlobalTimeInCtxTime + Number(nextTimestamp) + startInSec) {
        if (nextUtterance) {
          speechSynthesis.speak(nextUtterance)
          nextUtterance = null
        }
        if (ttsInstructions && ttsTimestamps.length) {
          nextTimestamp = ttsTimestamps.shift()
          if (!nextTimestamp) return
          if (partialIdToRegisterWith !== null) {
            if (ttsInstructions[nextTimestamp][partialIdToRegisterWith]
              && ttsInstructions[nextTimestamp][partialIdToRegisterWith][ttsLanguage]) {
              nextUtterance = new SpeechSynthesisUtterance(ttsInstructions[nextTimestamp][partialIdToRegisterWith][ttsLanguage])
              nextUtterance.lang = ttsLanguage
            }
          } else {
            if (ttsInstructions[nextTimestamp][ttsLanguage]) {
              nextUtterance = new SpeechSynthesisUtterance(ttsInstructions[nextTimestamp][ttsLanguage])
              nextUtterance.lang = ttsLanguage
            }
          }
        } else {
          window.clearInterval(speechIntervalId)
        }
      }
    }, 50)
  }

  /* END OF TEXT TO SPEECH */
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
