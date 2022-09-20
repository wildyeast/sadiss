<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Blank</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Blank</ion-title>
        </ion-toolbar>
      </ion-header>

      <div id="container">
        <ion-button @click="register">Test</ion-button>
        <p>{{ currentTime }}</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton } from '@ionic/vue';
import { ref, onMounted } from 'vue';
import { TextToSpeech } from '@capacitor-community/text-to-speech'
import Player from '../Player'
import { SpearPartial } from '../types/SpearPartial'
import { ChoirTtsInstructions, SequencerTtsInstructions } from "../types";

onMounted(async () => {
  await initializeMCorp()
})

let motion: { pos: number } = { pos: 0 }
const currentTime = ref(-1)
const startTest = async () => {
  // await initializeMCorp()

  // Play continuous sine wave
  // const audioContext = new AudioContext()
  // const osc = audioContext.createOscillator()
  // osc.frequency.setValueAtTime(440, audioContext.currentTime)

  // const gain = audioContext.createGain()
  // gain.gain.setValueAtTime(0.2, audioContext.currentTime)

  // osc.connect(gain)
  // gain.connect(audioContext.destination)
  // osc.start()

  // Play text to speech

  // let lastSpokenNumber = -1
  // setInterval(async () => {
  //   currentTime.value = Math.floor(motion.pos % 10)
  //   if (lastSpokenNumber !== currentTime.value) {
  //     if (currentTime.value % 2 === 0) {
  //       // const utterance = new SpeechSynthesisUtterance(currentTime.value.toString())
  //       // window.speechSynthesis.speak(utterance)

  //       await TextToSpeech.speak({
  //         text: currentTime.value.toString(),
  //         lang: 'en-US',
  //         rate: 1.0,
  //         pitch: 1.0,
  //         volume: 1.0,
  //         category: 'ambient',
  //       })

  //       lastSpokenNumber = currentTime.value
  //     }
  //     osc.frequency.setValueAtTime(440 + currentTime.value * 12, audioContext.currentTime)
  //   }
  // }, 10)
}

const initializeMCorp = async () => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // eslint-disable-next-line
  const mCorpApp = MCorp.app('8844095860530063641', { anon: true })
  mCorpApp.run = function () {
    motion = mCorpApp.motions['shared']
  }
  mCorpApp.init()
}

const hostUrl = "https://sadiss.org/api/v1"

const isRegistered = ref(false)
let intervalId = -1
const player = ref(new Player())
const performanceId = ref(9)
const attemptingToRegister = ref(false)
let initialTimingSrcIntervalId = -1
const timingSrcPosition = ref(-1)
const partialIdToRegisterWith = ref(0)

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

  // Synthesize voice (with volume set to 0) on registration to make TTS work on iOS
  // const initialUtterance = new SpeechSynthesisUtterance('You are registered.')
  // initialUtterance.volume = 0
  // speechSynthesis.speak(initialUtterance)

  // Resume audioCtx for iOS
  await player.value.audioContext.resume()

  initialTimingSrcIntervalId = window.setInterval(() => {
    timingSrcPosition.value = Number(motion.pos.toFixed(1))
  }, 10)

  // Pass over register function from this file to player
  player.value.register = register

  const response = await fetch(hostUrl + '/client/create', {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ performance_id: performanceId.value, partial_id: partialIdToRegisterWith.value }),
  })
  const data = await response.json()
  // deviceRegistrationId.value = data.id // Only used in UI.

  // Check for start immediately, afterwards check in intervals of 1 second.
  await checkForStart(data.token)
  intervalId = window.setInterval(async () => {
    await checkForStart(data.token)
  }, 1000)

  attemptingToRegister.value = false
  isRegistered.value = true
}

let ttsInstructions: null
let ttsRate = 0
let partialData: SpearPartial[]
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
    // if (partialData.length === 1) {
    //   partialIdFromServer = Number(partialData[0].index)
    // }

    let prepareStarted = false

    window.clearInterval(initialTimingSrcIntervalId)
    intervalId = window.setInterval(() => {
      timingSrcPosition.value = motion.pos
      if (timingSrcPosition.value >= startTimeFromServer + 3) {
        // print += timingSrcPosition.value + '\n'
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

let outputLatencyFromLocalStorage = 0
const ttsLanguage = ref('en-US')
let speaking = false
let speechIntervalId = -1
let partialIdFromServer = 0
const start = async () => {
  const startInSec = 5
  const currentGlobalTimeInCtxTime = motion.pos - player.value.offset // Do not change!

  player.value.setup(
    partialData,
    startInSec,
    currentGlobalTimeInCtxTime,
    outputLatencyFromLocalStorage ? outputLatencyFromLocalStorage : 0
  )

  isRegistered.value = false

  /* TEXT TO SPEECH */
  if (ttsInstructions && ttsLanguage.value) {
    const ttsTimestamps = Object.keys(ttsInstructions).map(timestamp => Number(timestamp))

    // const voices = speechSynthesis.getVoices()
    // ttsVoiceToUse.value = voices.filter(voice => voice.lang === ttsLanguage.value)[0]

    let nextTimestamp = ttsTimestamps.shift()

    console.log('Next timestamp: ', nextTimestamp)

    // === undefined needed since it can be 0
    if (!(typeof nextTimestamp === 'number')) return

    speaking = true

    // let nextUtterance: SpeechSynthesisUtterance | null

    // if (typeof partialIdToRegisterWith.value === 'number') {
    //   nextUtterance = createChoirUtterance(ttsInstructions, nextTimestamp, ttsLanguage.value, partialIdFromServer)
    // } else {
    //   nextUtterance = createSequencerUtterance(ttsInstructions, nextTimestamp, ttsLanguage.value)
    // }

    //       await TextToSpeech.speak({
    //         text: currentTime.value.toString(),
    //         lang: 'en-US',
    //         rate: 1.0,
    //         pitch: 1.0,
    //         volume: 1.0,
    //         category: 'ambient',
    //       })

    speechIntervalId = window.setInterval(async () => {
      if (motion.pos - player.value.offset >= currentGlobalTimeInCtxTime + Number(nextTimestamp) + startInSec) {
        if (!ttsInstructions || typeof nextTimestamp !== 'number' || !ttsLanguage.value) {
          return
        }
        console.log('Trying to speak: ', ttsInstructions[nextTimestamp][ttsLanguage.value])
        TextToSpeech.speak({
          text: ttsInstructions[nextTimestamp][ttsLanguage.value],
          lang: 'en-US',
          rate: 1.0,
          pitch: 1.0,
          volume: 1.0,
          category: 'ambient',
        })
        // if (nextUtterance) {
        //   nextUtterance.rate = ttsRate
        //   if (!speaking) return
        //   speechSynthesis.speak(nextUtterance)
        //   nextUtterance = null
        // }
        if (ttsInstructions && ttsTimestamps.length) {
          nextTimestamp = Number(ttsTimestamps.shift())
          if (!nextTimestamp) return
          // if (typeof partialIdToRegisterWith.value === 'number') {
          //   nextUtterance = createChoirUtterance(ttsInstructions, nextTimestamp, ttsLanguage.value, partialIdFromServer)
          // } else {
          //   nextUtterance = createSequencerUtterance(ttsInstructions, nextTimestamp, ttsLanguage.value)
          // }
        } else {
          window.clearInterval(speechIntervalId)
          speaking = false
        }
      }
    }, 50)
  }

  /* END OF TEXT TO SPEECH */
}

// const createSequencerUtterance = (ttsInstructions: SequencerTtsInstructions, nextTimestamp: number, ttsLanguage: string): SpeechSynthesisUtterance | null => {
//   let utterance: SpeechSynthesisUtterance | null = null;
//   if (ttsInstructions[nextTimestamp][ttsLanguage]) {
//     utterance = new SpeechSynthesisUtterance(ttsInstructions[nextTimestamp][ttsLanguage])
//     utterance.lang = ttsLanguage
//     // if (ttsVoiceToUse.value) {
//     //   utterance.lang = ''
//     //   utterance.voice = ttsVoiceToUse.value
//     // }
//   }
//   return utterance
// }

// const createChoirUtterance = (ttsInstructions: ChoirTtsInstructions, nextTimestamp: number, ttsLanguage: string, partialId: number): SpeechSynthesisUtterance | null => {
//   let utterance: SpeechSynthesisUtterance | null = null;
//   if (ttsInstructions[nextTimestamp][partialId]
//     && ttsInstructions[nextTimestamp][partialId][ttsLanguage]) {
//     console.log('Creating choir utterance.')
//     utterance = new SpeechSynthesisUtterance(ttsInstructions[nextTimestamp][partialId][ttsLanguage])
//     utterance.lang = ttsLanguage
//     // if (ttsVoiceToUse.value) {
//     //   utterance.lang = ''
//     //   utterance.voice = ttsVoiceToUse.value
//     // }
//   }
//   return utterance
// }

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

<style scoped>
#container {
  text-align: center;

  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
}

#container strong {
  font-size: 20px;
  line-height: 26px;
}

#container p {
  font-size: 16px;
  line-height: 22px;

  color: #8c8c8c;

  margin: 0;
}

#container a {
  text-decoration: none;
}
</style>
