<script setup lang="ts">
import Player from "./Player"
import OutputLatencyCalibration from './components/OutputLatencyCalibration.vue'
import { onMounted, Ref, ref } from "vue"
import { ChoirTtsInstructions, SequencerTtsInstructions } from "./types";
import { SpearPartial } from './types/SpearPartial'
import Help from './components/Help.vue'
import IconSadiss from './assets/icons/IconSadiss.svg'
import IconSadissLogo from './assets/icons/IconSadissLogo.svg'
import IconSoundsystem from './assets/icons/IconSoundsystem.svg'
import IconGlobe from './assets/icons/IconGlobe.svg'
import IconHelp from './assets/icons/IconHelp.svg'
import IconSettings from './assets/icons/IconSettings.svg'
import IconFooter from './assets/icons/IconFooter.svg'
import IconJoinPerformance from './assets/icons/IconJoinPerformance.svg'
import IconArrowLeft from './assets/icons/IconArrowLeft.svg'
import IconJoin from './assets/icons/IconJoin.svg'
import IconPlayingGlow from './assets/icons/IconPlayingGlow.svg'

const availableTracks: Ref<{ id: number, title: string }[]> = ref([])
const countdownTime = ref(-1)
const deviceRegistrationId = ref(-1) // Only used in UI
const hasCalibratedThisSession = ref(false)
// const hostUrl = "http://sadiss.test/v1"
const hostUrl = "https://sadiss.org/api/v1"
let intervalId: number
let initialTimingSrcIntervalId: number
const attemptingToRegister = ref(false)
const isRegistered = ref(false)
const motion: Ref<{ pos: number }> = ref({ pos: 0 })
const motionConnected = ref(false)
let outputLatencyFromLocalStorage: number
let partialData: SpearPartial[]
let partialIdToRegisterWith: number | null
let partialIdFromServer = -1
let performanceId = ref(-1)
const performances = ref()
const selectedPerformance = ref()
const player: Ref<Player> = ref(new Player())
let print = ''
let timingSrcPosition: Ref<number> = ref(-1)
let trackId = ref(1)
let ttsInstructions: null
const ttsLanguage = ref('en-US')
let ttsRate = 1
const ttsVoiceToUse = ref()
let speechIntervalId = -1
let speaking = false
const currentPage = ref('help')

// If client loses focus (lock screen, tab switch, etc), stop playback.
// Especially necessary for iOS. There, script execution gets suspended on screen lock,
// and resumed on unlock, leading to desync between devices.
document.addEventListener('visibilitychange', () => {
  if (document['hidden']) {
    if (player.value.playing) {
      player.value.stop()
      window.clearInterval(speechIntervalId)
      speaking = false
    }
  }
}, false)

onMounted(async () => {
  // Get performances to later check against performanceId URL parameter (if present) to make sure performance exists
  const performanceResponse = await fetch(hostUrl + '/performance')
  performances.value = await performanceResponse.json()

  // Get URL parameters and set performanceId and partialId if present
  const params = new URLSearchParams(window.location.search)
  if (performances.value.map((p: any) => p.id).includes(Number(params.get('id')))) {
    performanceId.value = Number(params.get('id'))
  }

  if (typeof params.get('partial_id') === 'string') {
    partialIdToRegisterWith = Number(params.get('partial_id'))
  }

  if (performanceId.value >= 0) {
    selectedPerformance.value = performances.value.find((p: { id: number }) => p.id === performanceId.value)
  }

  initializeMCorp()

  // Fetch tracks
  // const res = await fetch(hostUrl + '/track')
  // availableTracks.value = await res.json()


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
}

const register = async () => {
  if (isRegistered.value) {
    window.clearInterval(intervalId)
    isRegistered.value = false
    return
  }

  if (!player.value) return

  if (performanceId.value < 0) {
    alert("Select a performance id.")
    return
  }

  attemptingToRegister.value = true

  // Resume audioCtx for iOS
  await player.value.audioContext.resume()

  // Synthesize voice (with volume set to 0) on registration to make TTS work on iOS
  const initialUtterance = new SpeechSynthesisUtterance('You are registered.')
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
    body: JSON.stringify({ performance_id: performanceId.value, partial_id: partialIdToRegisterWith }),
  })
  const data = await response.json()
  deviceRegistrationId.value = data.id // Only used in UI.

  // Check for start immediately, afterwards check in intervals of 1 second.
  await checkForStart(data.token)
  intervalId = window.setInterval(async () => {
    await checkForStart(data.token)
  }, 1000)

  attemptingToRegister.value = false
  isRegistered.value = true
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

    if (ttsInstructions && ttsInstructions['_config'] && ttsInstructions['_config']['rate']) {
      const rate = ttsInstructions['_config']['rate']
      if (rate) {
        ttsRate = rate < 0.05 ? 0.05 : rate > 2 ? 2 : rate
      }
    }

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

    // If array of partials has only one partial we are most likely in choir mode.
    // Use id of this singular partial for selecting which of the voices in TTS to play.
    if (partialData.length === 1) {
      partialIdFromServer = Number(partialData[0].index)
    }

    let prepareStarted = false

    window.clearInterval(initialTimingSrcIntervalId)
    intervalId = window.setInterval(() => {
      timingSrcPosition.value = motion.value.pos
      if (timingSrcPosition.value >= startTimeFromServer + 3) {
        print += timingSrcPosition.value + '\n'
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
    outputLatencyFromLocalStorage ? outputLatencyFromLocalStorage : 0
  )

  isRegistered.value = false
  blink()

  /* TEXT TO SPEECH */
  if (ttsInstructions && ttsLanguage.value) {
    const ttsTimestamps = Object.keys(ttsInstructions).map(timestamp => Number(timestamp))

    const voices = speechSynthesis.getVoices()
    ttsVoiceToUse.value = voices.filter(voice => voice.lang === ttsLanguage.value)[0]

    let nextTimestamp = ttsTimestamps.shift()

    // === undefined needed since it can be 0
    if (!(typeof nextTimestamp === 'number')) return

    speaking = true

    let nextUtterance: SpeechSynthesisUtterance | null

    if (typeof partialIdToRegisterWith === 'number') {
      nextUtterance = createChoirUtterance(ttsInstructions, nextTimestamp, ttsLanguage.value, partialIdFromServer)
    } else {
      nextUtterance = createSequencerUtterance(ttsInstructions, nextTimestamp, ttsLanguage.value)
    }

    speechIntervalId = window.setInterval(() => {
      if (motion.value.pos - player.value.offset >= currentGlobalTimeInCtxTime + Number(nextTimestamp) + startInSec) {
        if (nextUtterance) {
          nextUtterance.rate = ttsRate
          if (!speaking) return
          speechSynthesis.speak(nextUtterance)
          nextUtterance = null
        }
        if (ttsInstructions && ttsTimestamps.length) {
          nextTimestamp = Number(ttsTimestamps.shift())
          if (!nextTimestamp) return
          if (typeof partialIdToRegisterWith === 'number') {
            nextUtterance = createChoirUtterance(ttsInstructions, nextTimestamp, ttsLanguage.value, partialIdFromServer)
          } else {
            nextUtterance = createSequencerUtterance(ttsInstructions, nextTimestamp, ttsLanguage.value)
          }
        } else {
          window.clearInterval(speechIntervalId)
          speaking = false
        }
      }
    }, 50)
  }

  /* END OF TEXT TO SPEECH */
}

const createSequencerUtterance = (ttsInstructions: SequencerTtsInstructions, nextTimestamp: number, ttsLanguage: string): SpeechSynthesisUtterance | null => {
  let utterance: SpeechSynthesisUtterance | null = null;
  if (ttsInstructions[nextTimestamp][ttsLanguage]) {
    utterance = new SpeechSynthesisUtterance(ttsInstructions[nextTimestamp][ttsLanguage])
    utterance.lang = ttsLanguage
    if (ttsVoiceToUse.value) {
      utterance.lang = ''
      utterance.voice = ttsVoiceToUse.value
    }
  }
  return utterance
}

const createChoirUtterance = (ttsInstructions: ChoirTtsInstructions, nextTimestamp: number, ttsLanguage: string, partialId: number): SpeechSynthesisUtterance | null => {
  let utterance: SpeechSynthesisUtterance | null = null;
  if (ttsInstructions[nextTimestamp][partialId]
    && ttsInstructions[nextTimestamp][partialId][ttsLanguage]) {
    console.log('Creating choir utterance.')
    utterance = new SpeechSynthesisUtterance(ttsInstructions[nextTimestamp][partialId][ttsLanguage])
    utterance.lang = ttsLanguage
    if (ttsVoiceToUse.value) {
      utterance.lang = ''
      utterance.voice = ttsVoiceToUse.value
    }
  }
  return utterance
}

const calibrationFinished = (calibratedLatency: number) => {
  outputLatencyFromLocalStorage = Number(calibratedLatency)
  hasCalibratedThisSession.value = true
  currentPage.value = 'register'
}

const playingBtn = ref()
const blink = () => {
  if (playingBtn.value) {
    playingBtn.value.style.display = playingBtn.value.style.display !== 'none' ? 'none' : 'block'
    window.setTimeout(() => {
      blink()
    }, 1000)
  }
}

const playLocally = async () => {
  // // Resume audioCtx for iOS
  // player.value.audioContext.resume()

  // const partialData = await fetch(`${hostUrl}/track/${trackId.value}`)
  //   .then(res => res.json())
  //   .then(data => JSON.parse(data.partials))
  // player.value.setup(partialData, 0, 0, outputLatencyFromLocalStorage)
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

const helpEndReached = () => {
  if (selectedPerformance.value['calibrate_output_latency']) {
    currentPage.value = 'outputLatencyCalibration'
  } else {
    currentPage.value = 'register'
  }
}

</script>

<template>
  <div class="h-screen w-screen md:w-1/3 md:mx-auto flex flex-col justify-between"
       v-if="motionConnected">

    <div v-if="currentPage === 'start'"
         class="flex flex-col  justify-around text-secondary h-4/5">
      <img :src="IconSadiss"
           class="w-1/4 mx-auto" />
      <h1 v-if="selectedPerformance"
          class="text-center">
        {{ selectedPerformance.display_title ? selectedPerformance.display_title : selectedPerformance.title}}
      </h1>
      <h1 v-else>No performance selected</h1>

      <div class="flex flex-col items-center text-lg">
        <img :src="IconSoundsystem"
             width="50"
             height="50" />
        <p>Soundsystem</p>
      </div>

      <!-- Language select -->
      <div class="flex flex-col items-center text-lg">
        <img :src="IconGlobe"
             class="mb-1"
             width="50"
             height="50" />
        <select class="bg-primary"
                v-model="ttsLanguage">
          <option value="en-US">English</option>
          <option value="de-DE">Deutsch</option>
        </select>

        <!-- Bottom buttons -->
        <div class="flex justify-around items-center mt-4 w-2/3">
          <button @click="currentPage = 'help'"
                  class="flex flex-col items-center text-lg">
            <img :src="IconHelp"
                 width="50"
                 height="50" />
          </button>
          <button @click="currentPage = 'register'"
                  class="flex flex-col items-center text-lg">
            <img :src="IconJoin"
                 :width="selectedPerformance['calibrate_output_latency'] ? 60 : 50"
                 :height="selectedPerformance['calibrate_output_latency'] ? 60 : 50" />
          </button>
          <button v-if="selectedPerformance['calibrate_output_latency']"
                  @click="currentPage = 'outputLatencyCalibration'"
                  class="flex flex-col items-center text-lg">
            <img :src="IconSettings"
                 width="50"
                 height="50" />
          </button>
        </div>
      </div>
    </div>

    <div v-else-if="currentPage === 'help'"
         class="flex flex-col items-center justify-between h-4/5">
      <Help isChoirPerformance
            @endReached="helpEndReached" />
    </div>

    <OutputLatencyCalibration v-else-if="currentPage === 'outputLatencyCalibration'"
                              @calibrationFinished="calibrationFinished"
                              :motion="motion" />

    <div v-else-if="currentPage === 'register'"
         class="mb-4 my-auto">
      <div class="flex flex-col items-center justify-around h-full text-secondary">
        <div class="w-full flex flex-col items-center">
          <div v-if="player.playing">
            <div class="h-40 w-40 mx-auto bg-secondary rounded-full">
              <img :src="IconPlayingGlow"
                   class="w-full h-full"
                   ref="playingBtn" />
            </div>
            <p class="text-tertiary text-2xl mt-6 text-center">Playing</p>
          </div>
          <div v-else-if="attemptingToRegister"
               class="flex justify-center items-center w-40 h-40">
            <div class="lds-dual-ring" />
          </div>
          <button v-else-if="!isRegistered"
                  @click="register"
                  class="flex flex-col items-center">
            <img :src="IconJoinPerformance"
                 class="h-40" />
            <p class="text-tertiary text-2xl mt-6">Join</p>
          </button>
          <div v-else-if="isRegistered"
               class="flex flex-col items-center">
            <button class="h-40 w-40 border-8 rounded-full border-secondary">
              <span class="text-tertiary">{{deviceRegistrationId}}</span>
            </button>
            <p class="text-tertiary text-2xl mt-6">Joined</p>
          </div>
        </div>
        <div class="flex flex-col items-center text-lg mb-0">
          <div>
            <img :src="IconSoundsystem"
                 width="40"
                 height="40" />
          </div>
          <p class="text-sm mt-1 text-center w-full">{{ selectedPerformance.title }}</p>
          <button @click="currentPage = 'start'"
                  class="mt-6">
            <img :src="IconArrowLeft"
                 width="20"
                 height="20" />
          </button>
        </div>
      </div>
    </div>
    <!-- Footer -->
    <div class="flex flex-col items-center text-lg">
      <img :src="IconSadissLogo"
           class="w-1/4" />
      <img :src="IconFooter"
           class="w-full h-auto" />
    </div>
    <!-- Loading Spinner while waiting for motion -->
  </div>
  <div v-else
       class="flex justify-center items-center h-screen">
    <div class="lds-dual-ring" />
  </div>
</template>

<style>
html,
body {
  @apply bg-primary;
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

.lds-dual-ring-colored:after {
  border-color: #FF6700 transparent #FF6700 transparent;
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
