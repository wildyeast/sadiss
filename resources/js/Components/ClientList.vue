<script setup>
import { useForm } from "@inertiajs/inertia-vue3"
import { computed, onMounted, reactive, ref } from "vue"
import Button from "./Button.vue"
import InfoBox from "./InfoBox.vue"
import InfoTuple from "./InfoTuple.vue"
import Player from "../Player.js"
import { track } from "@vue/reactivity";

const props = defineProps(['track', 'ttsInstructions', 'performanceId', 'playingTrack'])
const emits = defineEmits(['setPlayingTrack'])

const registeredClients = reactive([]);
const autoGetRegisteredClientsInterval = ref(null);
let maxRegisteredClients = ref(0);
let firstRegisteredClients = ref(0);
let synchronizing = ref(false);
let trackStarted = ref(false);
let timingSrcPosition = ref();
let timingSrcConnected = ref(false);
let allPartialsAllDevices = ref(false);
let motion;
// const ttsLanguages = ref([])
// const ttsLanguage = ref()
// const choirMode = computed(() => props.choirMode)
// const ttsLanguages = computed(() => {
//   console.log('TTS instructions: ', props.ttsInstructions)
//   if (choirMode.value) {
//     return props.ttsInstructions ? Object.keys(props.ttsInstructions[0][0]) : null
//   } else {
//     return props.ttsInstructions ? Object.keys(props.ttsInstructions[0]) : null
//   }
// })
const waveform = ref('sine')
const partialOverlap = ref()
const isPoliphonyLimited = ref(true)
const numberOfSimultaneousVoices = ref(64)
const calibrating = ref(false)
let beepIntervalId = null;
const firstStartTime = ref()

onMounted(async () => {
  // getRegisteredClients();
  autoGetRegisteredClients();
  const mCorpAppId = "8844095860530063641"
  const mCorpApp = MCorp.app(mCorpAppId, { anon: true })
  mCorpApp.run = () => {
    motion = mCorpApp.motions['shared']
    timingSrcConnected.value = true;
    synchronizeTimingSrcPosition()
  }
  mCorpApp.init()
})

async function synchronizeTimingSrcPosition () {
  if (!synchronizing.value) {
    if (motion.vel != 1) {
      motion.update(null, 1, null)
    }

    synchronizing.value = true;
    (function query () {
      if (motion.pos.toFixed(1) - timingSrcPosition.value != 0) {
        // TODO: Weird calculation, doesn't work with !== for some reason, no time to look into it now
        timingSrcPosition.value = motion.pos.toFixed(1)
      }
      if (synchronizing.value) {
        window.setTimeout(query, 10)
      }
    })();
  } else {
    synchronizing.value = false
    motion.update(0, 0, null)
    timingSrcPosition.value = motion.pos
  }
}

async function startTrack () {

  if (registeredClients.length === 0) {
    alert("No clients are registered.")
    return
  }

  const calculatedStartingPosition = motion.pos + 5
  let route;

  if (props.track && !props.track.is_choir && allPartialsAllDevices.value) {
    route = `${process.env.MIX_API_SLUG}/track/${props.track.id}/start_all/${calculatedStartingPosition}/${props.performanceId}`
  } else {
    route = `${process.env.MIX_API_SLUG}/track/${props.track.id}/start/${calculatedStartingPosition}/${props.performanceId}`
  }

  const number_of_simultaneous_voices = isPoliphonyLimited.value ? numberOfSimultaneousVoices.value : 0
  trackStarted.value = true
  const response = await axios.post(
    route,
    null,
    {
      params: {
        // tts_language: ttsLanguage.value,
        choir_mode: props.track.is_choir,
        waveform: waveform.value,
        partial_overlap: partialOverlap.value,
        number_of_simultaneous_voices
      }
    }
  )
  firstStartTime.value = Date.now()
  emits('setPlayingTrack')
}

async function getRegisteredClients () {
  const response = await axios.get(`${process.env.MIX_API_SLUG}/client/active/${props.performanceId}`);
  registeredClients.splice(0)
  for (const client of response.data) {
    registeredClients.push(client)
  }
  const length = registeredClients.length
  if (length > maxRegisteredClients.value) {
    maxRegisteredClients.value = length
  }
}

async function autoGetRegisteredClients () {
  if (!autoGetRegisteredClientsInterval.value) {
    await getRegisteredClients()

    autoGetRegisteredClientsInterval.value = window.setInterval(
      async () => {
        await getRegisteredClients()
      }, 2000
    )
  } else {
    autoGetRegisteredClientsInterval.value = null;
  }
}

async function removeClients () {
  for (const client of registeredClients) {
    const response = await axios.post(`${process.env.MIX_API_SLUG}/client/delete/${client.id}`)
    console.log("Removed client with id " + client.id)
  }
  getRegisteredClients();
}

function startCalibration () {

  if (!motion) {
    alert("No motion source connected. Try again in a few seconds.")
    return
  }

  if (calibrating.value) {
    calibrating.value = false
    window.clearInterval(beepIntervalId)
    return
  }

  const player = new Player();

  const audioCtx = window.AudioContext || window.webkitAudioContext;
  // Start audio context.
  player.audioContext = new audioCtx({ latencyHint: 0 })
  // This is necessary to make the audio context work on iOS.
  player.audioContext.resume()
  calibrating.value = true

  let startingSecond = motion.pos.toFixed(0)

  beepIntervalId = setInterval(() => {
    if (motion.pos > startingSecond) {
      startingSecond = motion.pos.toFixed(0)
      player.playOneShot(player.audioContext.currentTime)
    }
  }, 10)

}

</script>
<template>
  <div class="">
    <div class="flex flex-row mt-1">
      <InfoBox bgcolor="secondary" title="selected track" class="mr-1 w-1/3">
        <div v-if="props.track" class="">
          <InfoTuple name="title">{{ props.track.title }}</InfoTuple>
          <InfoTuple name="mode">{{ props.track.is_choir ? 'choir' : 'sound system'}}</InfoTuple>
          <div class="w-full justify-center items-center flex mt-4">
            <button v-if="props.track" @click="startTrack"
                    class="border-4 border-tertiary p-2 px-4 uppercase hover:bg-tertiary hover:text-white"
                    :class="synchronizing ? '' : 'hidden'">
              start
            </button>
            <div v-if="trackStarted && !playingTrack"
                class="flex justify-center">
              <div class="lds-dual-ring" />
            </div>
            <div class="text-sm" v-if="!synchronizing">Time is not running.</div>
          </div>
        </div>
        <div v-else class="p-1 text-sm">No track loaded</div>
      </InfoBox>
      <InfoBox title="clients" class="mr-1 w-1/3">
          <InfoTuple name="online">{{ registeredClients.length }}</InfoTuple>
          <InfoTuple name="max">{{ maxRegisteredClients }}</InfoTuple>
          <InfoTuple name="at start">{{ firstRegisteredClients}}</InfoTuple>
          <InfoTuple name="IDs">
            <span v-for="client of registeredClients"
                :key="client.id">
              {{ client.id }} <span v-if="client.partial_id">(Partial-Id: {{ client.partial_id }})</span>
            </span>
          </InfoTuple>
          <button @click="removeClients"
                  class="border h-8 p-1 uppercase">
            Drop all 
          </button>
      </InfoBox>
      <InfoBox title="distribution" class="w-1/3">
        <InfoTuple name="All partials to all devices">
          <input class="mr-2"
                type="checkbox"
                v-model="allPartialsAllDevices" />
        </InfoTuple>
        <InfoTuple name="Time">
            {{ synchronizing ? timingSrcPosition : "0.0" }}
          <button @click="synchronizeTimingSrcPosition"
                  class="w-6 h-6"
                  :disabled="!timingSrcConnected">
            {{ synchronizing ? '■' : '▶' }}
          </button>
        </InfoTuple>
        <InfoTuple name="waveform">
          <button :class="['mr-2', { 'bg-primary text-white': waveform === 'sine' }]" @click="waveform = 'sine'">
            SIN
          </button>
          <button :class="['mr-2', { 'bg-primary text-white': waveform === 'square' }]" @click="waveform = 'square'">
            SQR
          </button>
          <button :class="['mr-2', { 'bg-primary text-white': waveform === 'sawtooth' }]" @click="waveform = 'sawtooth'">
            SAW
          </button>
          <button :class="['mr-2', { 'bg-primary text-white': waveform === 'triangle' }]" @click="waveform = 'triangle'">
            TRI
          </button>
        </InfoTuple>
        <InfoTuple name="overlap">
          <input 
                v-if="!props.track || !props.track.is_choir"
                class="h-6"
                type="number"
                placeholder="none"
                v-model="partialOverlap">
        </InfoTuple>
        <InfoTuple name="polyphony limit">
          <input 
                v-if="!props.track || !props.track.is_choir"
                class="h-6"
                type="number"
                placeholder="unlimited"
                v-model="numberOfSimultaneousVoices">
        </InfoTuple>
      </InfoBox>
    </div>
      <!-- <div v-if="ttsLanguages && ttsLanguages.length">
        <label class="mr-2">Select TTS language</label>
        <select v-model="ttsLanguage">
          <option value=''
                  selected>No TTS</option>
          <option v-for="lang of ttsLanguages">{{ lang }}</option>
        </select>
      </div> -->
      <!--
      <div>
        <button @click="getRegisteredClients"
                class="border p-2"
                :class="autoGetRegisteredClientsInterval ? 'border-b-green-400 border-l-green-400 border-t-green-400' : 'border'">
          Refresh list
        </button>
        <button @click="autoGetRegisteredClients"
                class="border-b border-t border-r p-2"
                :class="autoGetRegisteredClientsInterval ? 'border-green-400' : 'border-b border-t border-r'">
          Auto
        </button>
      </div>
    <button @click="startCalibration">{{ calibrating ? 'Stop' : 'Start' }} calibration beep</button>
      -->
  </div>
</template>
