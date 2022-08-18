<script setup>
import BreezeAuthenticatedLayout from '@/Layouts/Authenticated.vue'
import { Head, useForm, Link } from '@inertiajs/inertia-vue3'
import { onMounted, reactive, toRefs, ref, nextTick } from 'vue'
import QrcodeVue from 'qrcode.vue'
import Player from '@/Components/Player.vue'
import ClientList from '@/Components/ClientList.vue'
import TrackList from '@/Components/TrackList.vue'
import InfoBox from "@/Components/InfoBox.vue"
import InfoTuple from "@/Components/InfoTuple.vue"
import axios from 'axios'
import { downloadZip } from 'client-zip'

const path = {
  name: '',
  id: ''
}
const pathSplit = window.location.pathname.split('/')
path.name = pathSplit[pathSplit.length - 2]
path.id = pathSplit[pathSplit.length - 1]

let category = ''
const id = path.id
const data = reactive({})
const selectedTrack = ref()
const playingTrack = ref()
const showPerformanceQRCode = ref(false)
const showPartialQRCodes = ref(false)


onMounted(async () => {
  if (path.name === 'tracks') {
    category = 'track'
  } else if (path.name === 'composers') {
    category = 'composer'
  } else {
    category = 'performance'
  }

  const response = await axios.get(`${process.env.MIX_API_SLUG}/${category}/${path.id}`)
  for (const entry of Object.keys(response.data)) {
    data[entry] = response.data[entry]
  }
})

const trackSelected = (track) => {
  selectedTrack.value = track
}

const partials = ref()
const generatePartialQRCodes = async () => {
  if (showPartialQRCodes.value) {
    showPartialQRCodes.value = false
    return
  }
  if (!selectedTrack.value) {
    alert('Select a track.')
    return
  }

  const response = await axios.get(`${process.env.MIX_API_SLUG}/track/${selectedTrack.value.id}/partials`)
  partials.value = response.data
  if (confirm(`This track has ${partials.value.length} partials. Depending on your system, displaying a QR code for each of these partials could take a long time and/or crash your machine. Do you want to display the QR codes?`)) {
    showPartialQRCodes.value = true
  }
}

// Download QR codes
// Adapted from https://stackoverflow.com/a/38019175/16725862
const working = ref(false)
const performanceQrCodeContainer = ref()
const downloadPerformanceQrCode = async () => {
  working.value = true
  showPerformanceQRCode.value = true
  await nextTick()
  const svgData = performanceQrCodeContainer.value.innerHTML
  const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" })
  const svgUrl = URL.createObjectURL(svgBlob)
  const downloadLink = document.createElement("a")
  downloadLink.href = svgUrl
  downloadLink.download = `${data['location'].replace(/ /g, '-')}_QR-Code.svg`
  document.body.appendChild(downloadLink)
  downloadLink.click()
  document.body.removeChild(downloadLink)
  showPerformanceQRCode.value = false
  working.value = false
}

const partialQrCodeContainers = ref()
const partialIds = ref()
const downloadPartialQrCodes = async () => {

  if (!confirm('This downloads QR codes (in a zipped folder) for each partial of the track in this performance with the most partials. Depending on the amount of partials, the downloaded zip could be quite large. Do you wish to proceed?')) {
    return
  }

  working.value = true

  const response = await axios.get(`${process.env.MIX_API_SLUG}/performance/${path.id}/partial_ids`)
  const responseData = await response.data
  partialIds.value = Object.values(responseData)

  showPartialQRCodes.value = true
  await nextTick()

  const svgBlobs = []

  for (const container of partialQrCodeContainers.value) {
    const svgData = container.innerHTML
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" })
    svgBlobs.push({
      name: `${data['location'].replace(/ /g, '-')}_Voice-${partialQrCodeContainers.value.indexOf(container)}.svg`,
      input: svgBlob
    })
  }

  const blob = await downloadZip([...svgBlobs]).blob()

  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = `${data['location'].replace(/ /g, '-')}_Voices_QR-Codes`
  link.click()
  link.remove()

  showPartialQRCodes.value = false
  working.value = false
}

const timer = ref()
const TIME_BEFORE_START = 8
const setPlayingTrack = track => {
  playingTrack.value = selectedTrack.value
  timer.value = TIME_BEFORE_START * -1
  const counter = setInterval(() => {
    timer.value += 1
    if (timer.value >= playingTrack.value.duration) {
      clearInterval(counter)
      playingTrack.value = null
    };
  }, 1000)
}

</script>

<template>
  <div>

    <Head title="Details" />

    <BreezeAuthenticatedLayout>
      <template #header>
        <h2 class="uppercase font-semibold font-mono text-xl text-white leading-tight">
          <template v-if="path.name === 'tracks'">Track details</template>
          <template v-if="path.name === 'performances'">Perform</template>
        </h2>
      </template>
      <div v-if="Object.keys(data).length > 0"
           class="w-100 mt-2 py-8 bg-white border border-gray-200 shadow md:px-6 md:justify-center">
        <div class="flex flex-col max-w-7xl mx-auto px-4">
          <div class="flex justify-between"
               v-if="path.name !== 'performances'">
            <div class="flex mb-4 text-slate-400 text-xs">
              <div class="flex flex-col mr-4">
                <span>Id: </span>
                <span>Created at:</span>
                <span>Updated at:</span>
              </div>
              <div class="flex flex-col">
                <span>{{ data['id'] }}</span>
                <span>{{ data['created_at'] }}</span>
                <span>{{ data['updated_at'] }}</span>
              </div>
            </div>
            <Link v-if="category"
                  :href="route(`${category}.edit`, { id: id })">
            <!-- <span class="material-icons mi-edit text-blue-500" /> -->
            ✏️
            </Link>
          </div>
          <!-- Track -->
          <template v-if="path.name === 'tracks'">
            <div class="flex mb-4">
              <!-- Left hand side -->
              <div class="flex-1">
                <p class="mb-4 text-2xl">{{ data['title'] }}</p>
                <p class="text-justify">{{ data['description'] }}</p>
              </div>
              <!-- Right hand side -->
              <div class="flex-1 flex flex-col items-center">
                <p>Play track on this device</p>
                <Player :partialData="data['partials']" />
              </div>
            </div>
            <!-- Below -->
            <!-- <div>
              <ClientList :trackId="id"
                          :ttsInstructions="JSON.parse(data['tts_instructions'])" />
            </div> -->
          </template>
          <!-- Composer -->
          <template v-if="path.name === 'composers'">
            <div class="flex">
              <!-- Left hand side -->
              <div class="flex-1">
                <div class="flex justify-between items-center mb-4">
                  <p class="text-2xl">{{ data['name'] }}</p>
                  <p v-if="data['is_active']"
                     class="text-green-700">Active</p>
                  <p v-else
                     class="text-rose-500">Inactive</p>
                </div>
                <p class="text-justify">{{ data['description'] }}</p>
              </div>
              <!-- Right hand side -->
              <div class="flex-1 flex flex-col items-center">
                <img :src="data['photo']"
                     alt="An image of the composer."
                     class="w-1/2 mb-4">
                <div
                     class="flex flex-col items-center w-1/2 border border-bulma-input-border rounded-bulma-input-border-radius">
                  <p class="py-4 border-b border-bulma-input-border">Website</p>
                  <a :href="data['website_url']"
                     class="py-4 text-center">{{ data['website_url'] }}</a>
                </div>
              </div>
            </div>
          </template>
          <!-- Performance -->
          <div v-if="path.name === 'performances'"
               class="flex flex-row">
            <InfoBox title="performance"
                     class="w-2/3 mr-1">
              <InfoTuple name="id / location">
                {{ data['id'] }} / {{ data['location'] }}
              </InfoTuple>
              <InfoTuple name="status">
                <p v-if="data['is_active']"
                   class="text-green-700">active</p>
                <p v-else
                   class="text-rose-500">inactive</p>
              </InfoTuple>
              <InfoTuple name="start time">
                {{ data['start_time'] }}
              </InfoTuple>
              <InfoTuple name="end time">
                {{ data['end_time'] }}
              </InfoTuple>
              <InfoTuple name="download qr codes">
                <button class="border h-8 p-1 uppercase"
                        @click="downloadPerformanceQrCode">performance</button>
                <button class="border h-8 p-1 uppercase"
                        @click="downloadPartialQrCodes">partials</button>
              </InfoTuple>
            </InfoBox>
            <InfoBox title="playing track"
                     class="w-1/3"
                     bgcolor="tertiary">
              <InfoTuple name="name"
                         v-if="playingTrack">
                {{ playingTrack.title }}
                <span v-if="playingTrack.tts_instructions"> | TTS</span>
                <span v-if="playingTrack.is_choir"> | Choir</span>
              </InfoTuple>
              <InfoTuple name="time"
                         v-if="playingTrack">
                {{ Math.round(timer) }}s
                <span v-if="timer >= 0">/ {{ Math.round(playingTrack.duration) }}s ({{ Math.round((timer / playingTrack.duration)*100) }}%)</span>
              </InfoTuple>
              <div class="p-1 text-sm"
                   v-else>No track playing</div>
            </InfoBox>

            <div class="flex flex-row justify-end">
            </div>
            <div ref="performanceQrCodeContainer">
              <qrcode-vue v-if="showPerformanceQRCode"
                          :value="`http://sadiss.net/client?id=${id}`"
                          :size="300"
                          :render-as="'svg'"
                          level="H" />
            </div>
            <!-- Currently display: none, since otherwise it flashes when downloading voice qr codes
              If you want to show them in the browser, uncomment generatePartialQrCode button above
              and devise a method so it doesn't flash on download. -->
            <div v-if="showPartialQRCodes"
                 class="flex flex-wrap gap-2"
                 style="display: none;">
              <div v-for="partialId of partialIds">
                <div ref="partialQrCodeContainers">
                  <qrcode-vue :value="`http://sadiss.net/client?id=${id}&partial_id=${partialId}`"
                              :size="200"
                              :render-as="'svg'"
                              level="H" />
                </div>
              </div>
            </div>
          </div>
          <ClientList :trackId="selectedTrack ? selectedTrack.id : null"
                      :track="selectedTrack"
                      :performanceId="id"
                      :playingTrack="playingTrack"
                      @setPlayingTrack="setPlayingTrack"
                      :ttsInstructions="selectedTrack ? JSON.parse(selectedTrack.tts_instructions) : null"
                      :choirMode="selectedTrack ? selectedTrack.is_choir : null" />
          <div>
            <TrackList :performance="data"
                       :playingTrack="playingTrack"
                       @trackSelected="trackSelected" />

            <div v-if="working"
                 class="absolute top-0 left-0 flex justify-center items-center w-screen h-screen">
              <div class="absolute top-0 left-0 w-full h-full bg-slate-600 opacity-50" />
              <div class="lds-dual-ring" />
            </div>
          </div>
        </div>
      </div>
    </BreezeAuthenticatedLayout>
  </div>
</template>

<style>
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
