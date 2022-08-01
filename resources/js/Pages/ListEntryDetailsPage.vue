<script setup>
import BreezeAuthenticatedLayout from '@/Layouts/Authenticated.vue'
import { Head, useForm, Link } from '@inertiajs/inertia-vue3'
import { onMounted, reactive, toRefs, ref, nextTick } from 'vue'
import QrcodeVue from 'qrcode.vue'
import Player from '@/Components/Player.vue'
import ClientList from '@/Components/ClientList.vue'
import TrackList from '@/Components/TrackList.vue'
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
const showPerformanceQRCode = ref(false)
const showPartialQRCodes = ref(false)

onMounted(async () => {
  // TODO: This switch is identical to the one in ListPage.vue. Find a smart way to handle this.
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
const performanceQrCodeContainer = ref()
const downloadPerformanceQrCode = async () => {
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
}

const partialQrCodeContainers = ref([])
const downloadPartialQrCodes = async () => {
  if (!selectedTrack.value) {
    alert('Select a track.')
    return
  }

  const response = await axios.get(`${process.env.MIX_API_SLUG}/track/${selectedTrack.value.id}/partials`)
  partials.value = response.data

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
          <div class="flex justify-between">
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
          <template v-if="path.name === 'performances'">
            <div class="w-full">
              <div class="flex justify-between items-center mb-4">
                <p class="text-2xl">{{ data['location'] }}</p>
                <p v-if="data['is_active']"
                   class="text-green-700">Active</p>
                <p v-else
                   class="text-rose-500">Inactive</p>
              </div>
              <div class="flex flex-col">
                <button @click="showPerformanceQRCode = !showPerformanceQRCode">Generate QR-Code for this
                  performance</button>
                <button @click="downloadPerformanceQrCode">Download QR-Code for this performance</button>
                <!-- <button @click="generatePartialQRCodes">Generate QR-Code for each partial of the selected track</button> -->
                <button @click="downloadPartialQrCodes">Download QR-Codes of voices of this performance</button>
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
                <div v-for="partial of partials">
                  <p>Index: {{ partial.index }}</p>
                  <div ref="partialQrCodeContainers">
                    <qrcode-vue :value="`http://sadiss.net/client?id=${id}&partial_id=${partial.index}`"
                                :size="200"
                                :render-as="'svg'"
                                level="H" />
                  </div>
                </div>
              </div>
              <div class="flex">
                <div class="mr-4">
                  <p>Start time:</p>
                  <p>End time:</p>
                </div>
                <div>
                  <p>{{ data['start_time'] }}</p>
                  <p>{{ data['end_time'] }}</p>
                </div>
              </div>
              <TrackList :performance="data"
                         @trackSelected="trackSelected" />
              <ClientList v-if="selectedTrack"
                          :trackId="selectedTrack.id"
                          :performanceId="id"
                          :ttsInstructions="JSON.parse(selectedTrack.tts_instructions)"
                          :choirMode="selectedTrack.is_choir" />
            </div>
          </template>
        </div>
      </div>
    </BreezeAuthenticatedLayout>
  </div>
</template>
