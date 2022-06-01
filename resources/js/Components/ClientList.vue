<script setup>
import { useForm } from "@inertiajs/inertia-vue3";
import { computed, onMounted, reactive, ref } from "vue";
import Button from "./Button.vue";

const props = defineProps(['trackId', 'ttsInstructions', 'performanceId'])

const registeredClients = reactive([]);
const autoGetRegisteredClientsInterval = ref(null);
let synchronizing = ref(false);
let timingSrcPosition = ref();
let timingSrcConnected = ref(false);
let allPartialsAllDevices = ref(false);
let motion;
// const ttsLanguages = ref([])
const ttsLanguage = ref()
const ttsLanguages = computed(() => props.ttsInstructions ? Object.keys(props.ttsInstructions[0]) : null)
const choirMode = ref(false)
const waveform = ref('sine')

onMounted(async () => {
  // getRegisteredClients();
  autoGetRegisteredClients();
  const mCorpAppId = "8844095860530063641"
  const mCorpApp = MCorp.app(mCorpAppId)
  mCorpApp.run = () => {
    motion = mCorpApp.motions['shared']
    timingSrcConnected.value = true;
  }
  mCorpApp.init()
})

async function synchronizeTimingSrcPosition() {
  if (!synchronizing.value) {
    if (motion.vel != 1) {
      motion.update(null, 1, null)
    }

    synchronizing.value = true;
    (function query() {
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

async function startTrack() {
  const calculatedStartingPosition = motion.pos + 5
  let route;

  if (!choirMode.value && allPartialsAllDevices.value) {
    route = `/api/track/${props.trackId}/start_all/${calculatedStartingPosition}/${props.performanceId}`
  } else {
    route = `/api/track/${props.trackId}/start/${calculatedStartingPosition}/${props.performanceId}`
  }

  console.log("Calculated starting position: ", calculatedStartingPosition)
  console.log('Choir mode:', choirMode.value)
  const response = await axios.post(
    route,
    null,
    {
      params: {
        tts_language: ttsLanguage.value,
        choir_mode: choirMode.value,
        waveform: waveform.value
      }
    }
  )
}

async function getRegisteredClients() {
  const response = await axios.get(`/api/client/active/${props.performanceId}`);
  registeredClients.splice(0)
  for (const client of response.data) {
    registeredClients.push(client)
  }
}

async function autoGetRegisteredClients() {
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

async function removeClients() {
  for (const client of registeredClients) {
    const response = await axios.post(`/api/client/delete/${client.id}`)
    console.log("Removed client with id " + client.id)
  }
  getRegisteredClients();
}
</script>
<template>
  <div>
    <div class="flex items-center mb-4">
      <input class="mr-2" type="checkbox" v-model="allPartialsAllDevices" />
      <label class="mr-5">All partials to all devices</label>
      <input class="mr-2" type="checkbox" v-model="choirMode" />
      <label>Choir mode</label>
    </div>
    <div class="flex justify-between">
      <button
        @click="startTrack"
        class="border p-2"
        :class="synchronizing ? 'border-green-400' : 'border-red-400'"
        :disabled="!synchronizing"
      >
        Start track
      </button>
      <div class="flex">
        <button
          @click="synchronizeTimingSrcPosition"
          class="border p-2"
          :disabled="!timingSrcConnected"
        >
          Sync
        </button>
        <div class="border-b border-t border-r p-2">
          {{ synchronizing ? timingSrcPosition : "0.0" }}
        </div>
      </div>
      <div v-if="ttsLanguages && ttsLanguages.length">
        <label class="mr-2">Select TTS language</label>
        <select v-model="ttsLanguage">
          <option value='' selected>No TTS</option>
          <option v-for="lang of ttsLanguages">{{ lang }}</option>
        </select>
      </div>
      <div>
        <select v-model="waveform">
          <option value="sine" selected>Sine</option>
          <option value="square">Square</option>
          <option value="sawtooth">Saw</option>
          <option value="triangle">Triangle</option>
          <!-- <option value="">Custom</option> -->
        </select>
      </div>
      <button @click="removeClients" class="border p-2">
        Remove all registered clients
      </button>
      <div>
        <button
          @click="getRegisteredClients"
          class="border p-2"
          :class="
            autoGetRegisteredClientsInterval
              ? 'border-b-green-400 border-l-green-400 border-t-green-400'
              : 'border'
          "
        >
          Refresh list
        </button>
        <button
          @click="autoGetRegisteredClients"
          class="border-b border-t border-r p-2"
          :class="
            autoGetRegisteredClientsInterval
              ? 'border-green-400'
              : 'border-b border-t border-r'
          "
        >
          Auto
        </button>
      </div>
    </div>
    <p>IDs of registered clients (Total: {{ registeredClients.length }})</p>
    <div v-for="client of registeredClients" :key="client.id">
      {{ client.id }}
    </div>
  </div>
</template>
