<script setup lang="ts">
import { Axios } from 'axios'
import { ref, onMounted, inject, computed, watch, nextTick } from 'vue'
import TrackTile from '@/components/TrackTile.vue'
import { downloadZip } from 'client-zip'
import QrcodeVue from 'qrcode.vue'

const isUploadModalVisible = ref(false)
const axios: Axios | undefined = inject('axios')
if (!axios) {
  throw Error('Could not inject axios.')
}

const trackName = ref('')
const trackNotes = ref('')
const trackIsChoir = ref(false)
const trackWaveform = ref('sine')
const trackTtsRate = ref(1)
let file: File | undefined

const closeUploadModal = () => {
  if (trackName.value || trackNotes.value || trackIsChoir.value || trackWaveform.value !== 'sine' || trackTtsRate.value !== 1 || file) {
    if (!confirm('Your changes will be saved.')) {
      return
    }
  }
  trackName.value = ''
  trackNotes.value = ''
  trackIsChoir.value = false
  trackWaveform.value = 'sine'
  trackTtsRate.value = 1
  file = undefined
  isUploadModalVisible.value = false
}


const numberOfVoices = ref(2)
const ttsLanguages = ref('en-US, de-DE')

const voiceLangCombinations = computed(() => {
  // If nonChoir, only allow 1 voice
  const allowedNumberOfVoices = trackIsChoir.value ? numberOfVoices.value : 1
  const combinations = []
  for (let i = 0; i < allowedNumberOfVoices; i++) {
    for (const lang of ttsLanguages.value.split(',')) {
      combinations.push([i, lang.trim()])
    }
  }
  return combinations
})

const handleFileUpload = async (e: Event) => {
  // TODO: Refactor this so we don't use non-null assertion
  file = (<HTMLInputElement>e.target).files![0]
}

const ttsFiles: { [voice: number]: { [lang: string]: File } } = {}
const handleTtsFileUpload = async (e: Event, voice: number, lang: string) => {
  if (!ttsFiles[voice]) {
    ttsFiles[voice] = {}
  }
  ttsFiles[voice][lang] = (<HTMLInputElement>e.target).files![0]
  console.log(`Added to ttsFiles: Voice: ${voice}, lang: ${lang}, file: ${ttsFiles[voice][lang]}`)
}

const percentCompleted = ref()
const upload = async () => {
  if (!trackName.value) {
    alert('You must enter a track title.')
  }
  const data = new FormData()
  data.append('name', trackName.value)
  data.append('notes', trackNotes.value)
  data.append('mode', trackIsChoir.value ? 'choir' : 'nonChoir')
  data.append('waveform', trackWaveform.value)
  data.append('ttsRate', trackTtsRate.value.toString())

  if (file) {
    data.append('files', file, 'partialfile')
  }
  for (const voice in ttsFiles) {
    for (const lang in ttsFiles[voice]) {
      data.append('files', ttsFiles[voice][lang], `ttsfile_${voice}_${lang}`)
    }
  }

  const config = {
    onUploadProgress: function(progressEvent) {
      percentCompleted.value = Math.round( (progressEvent.loaded * 100) / progressEvent.total )
    }
  }     

  if (!editingTrackId) {
    axios
      .post(`${process.env.VUE_APP_API_URL}/upload`, data, config)
      .then((response) => {
        console.log(response.data)
        // Add newly added track to tracks
        tracks.value.push(response.data)
      	percentCompleted.value = null
        isUploadModalVisible.value = false
      })
      .catch((error: Error) => {
        console.log(error)
      })
  } else {
    try {
      const res = await axios.patch(`${process.env.VUE_APP_API_URL}/edit/${editingTrackId}`, data, config)
      console.log(res.data)
      const trackIdx = tracks.value.map((track) => track._id).indexOf(editingTrackId)
      tracks.value[trackIdx] = {
        ...tracks.value[trackIdx],
        ...res.data
      }
    } catch (err) {
      percentCompleted.value = null
      alert('Failed udpating track. ' + err)
    } finally {
      editingTrackId = ''
      percentCompleted.value = null
      isUploadModalVisible.value = false
    }
  }

  // Clear partial file so it doesn't get uploaded on next track upload
  file = undefined
  // Clear TTS file object so they don't get uploaded on next track upload
  for (const ttsFile in ttsFiles) delete ttsFiles[ttsFile]
}

const startTrack = async (id: string) => {
  await fetch(`${process.env.VUE_APP_API_URL}/start-track/${id}/${globalTime.value + 2}`, {
    method: 'POST'
  })
    .then((res) => res.json())
    .then((res) => {
      console.log(res)
      if (res.data === 'Track already running.') {
        alert('Cannot start track: Already running.')
      }
    })
}

const deleteTrack = async (id: string, name: string) => {
  if (confirm('Do you want to delete track: ' + name + '? This cannot be reversed.')) {
    try {
      await fetch(`${process.env.VUE_APP_API_URL}/delete-track/${id}`, {
        method: 'POST'
      })
      tracks.value = tracks.value.filter((track) => track._id !== id)
    } catch (err) {
      console.log('Failed deleting track with: ', err)
    }
  }
}

const partialFileDownloadInfo = ref()
const ttsFileDownloadInfo = ref<{ origName: string; fileName: string }[]>()
let editingTrackId = ''
const editTrack = async (id: string) => {
  try {
    const data = await fetch(`${process.env.VUE_APP_API_URL}/get-track/${id}`).then((res) => res.json())
    const track = data[0]
    editingTrackId = track._id
    trackName.value = track.name
    trackIsChoir.value = track.mode === 'choir'
    trackNotes.value = track.notes
    trackWaveform.value = track.waveform
    trackTtsRate.value = track.ttsRate
    partialFileDownloadInfo.value = track.partialFile
    ttsFileDownloadInfo.value = track.ttsFiles

    isUploadModalVisible.value = true
  } catch (err) {
    alert('Something went wrong. Error: ' + err)
    editingTrackId = ''
    return
  }
}

const tracks = ref<{ _id: string; name: string; notes: string }[]>([])
const getTracks = async () => {
  await fetch(`${process.env.VUE_APP_API_URL}/get-tracks`)
    .then((res) => res.json())
    .then((data) => (tracks.value = data.tracks))
    .catch((err) => console.log('Failed getting Tracks with: ', err))
}

let motion: any
const globalTime = ref(-1)
const initializeMCorp = async () => {
  // @ts-ignore: Can't find name MCorp, which is added via <script> in index.html
  const mCorpApp = MCorp.app(process.env.VUE_APP_MCORP_API_KEY, { anon: true })
  mCorpApp.run = () => {
    motion = mCorpApp.motions['shared']
    startClock()
  }
  mCorpApp.init()
}

const startClock = () => {
  setInterval(() => {
    globalTime.value = motion.pos
  }, 10)
}

/* QR Codes */

const performanceName = ref('Performance Name')
const expertMode = ref(false)
const defaultLanguage = ref('en-US')
const voiceCount = ref<number>()
const voiceNames = ref<string[]>([])
const ttsLangs = ref<string>('')

const getVoicesAndLanguages = async () => {
  let qrDataFromServer = <{ maxPartialsCount: number; ttsLangs: string[] }>{}
  await fetch(`${process.env.VUE_APP_API_URL}/get-voices-and-languages`)
    .then((res) => res.json())
    .then((data) => (qrDataFromServer = data))
    .catch((err) => console.log('Failed getting Tracks with: ', err))

  voiceCount.value = qrDataFromServer.maxPartialsCount <= 0 ? 0 : qrDataFromServer.maxPartialsCount
  ttsLangs.value = qrDataFromServer.ttsLangs.join(', ')
}

const openQrCodeModal = async () => {
  await getVoicesAndLanguages()
  isQrCodeModalVisible.value = true
}

const qrCodeData: QrCodeData[] = []

const generateQrCodes = async () => {
  if (voiceCount.value) {
    for (let i = 0; i < voiceCount.value; i++) {
      const data: QrCodeData = {
        choirId: i,
        roleName: voiceNames.value[i],
        performanceName: performanceName.value,
        expertMode: expertMode.value
      }
      if (ttsLangs.value) {
        data.tts = ttsLangs.value.split(', ').map((iso) => ({ iso, lang: convertIsoToLangName(iso.split('-')[0], iso) }))
        data.defaultLang = defaultLanguage.value
      }
      qrCodeData.push(data)
    }
  } else if (ttsLangs.value) {
    qrCodeData.push({
      performanceName: performanceName.value,
      expertMode: expertMode.value,
      defaultLang: defaultLanguage.value,
      tts: ttsLangs.value.split(', ').map((iso) => ({ iso, lang: convertIsoToLangName(iso.split('-')[0], iso) }))
    })
  }

  // If not enough data to generate QR codes, generate at least one code with performanceName and expertMode
  if (!qrCodeData.length) {
    qrCodeData.push({
      performanceName: performanceName.value,
      expertMode: false
    })
  }

  await downloadPartialQrCodes()
}

// Adapted from https://stackoverflow.com/a/69968496/16725862
// TODO: Returns e.g 'American English' and 'Deutsch (Deutschland)'. Ideally would return 'English' and 'Deutsch'.
const convertIsoToLangName = (locale: string, iso: string) => {
  const displayNames = new Intl.DisplayNames([locale], {
    type: 'language'
  })
  return displayNames.of(iso)
}

const isQrCodeModalVisible = ref(false)

const areQrCodesVisible = ref(false)
const qrCodeContainer = ref()

// Adapted from https://stackoverflow.com/a/38019175/16725862
const downloadPartialQrCodes = async () => {
  areQrCodesVisible.value = true
  await nextTick()
  const svgBlobs = []
  for (const qrCode of qrCodeContainer.value) {
    const svgData = qrCode.innerHTML
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    svgBlobs.push({
      name: `Voice-${qrCodeContainer.value.indexOf(qrCode)}.svg`,
      input: svgBlob
    })
  }
  const blob = await downloadZip([...svgBlobs]).blob()
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  // link.download = `${data['title'].replace(/ /g, '-')}_Voices_QR-Codes`
  link.download = `QR-Codes`
  link.click()
  link.remove()
  areQrCodesVisible.value = false
  isQrCodeModalVisible.value = false
}

// Enforce min and max values
watch(trackTtsRate, (newValue) => {
  if (newValue > 2) {
    trackTtsRate.value = 2
  } else if (newValue < 0.5) {
    trackTtsRate.value = 0.5
  }
})

onMounted(async () => {
  await initializeMCorp()
  await getTracks()
})
</script>
<template>
  <div class="mx-auto flex w-[90%] flex-col 2xl:w-[70%]">
    <p>🕒 {{ globalTime.toFixed(0) }}</p>
    <h1 class="my-6 text-3xl">{{ performanceName }}</h1>
    <div class="flex flex-row justify-start">
	    <Button @click="isUploadModalVisible = true" style="margin-left: 0 !important;">Upload new track</Button>
	    <Button @click="openQrCodeModal">Generate QR codes</Button>
    </div>

    <div
      v-if="tracks.length"
      class="grid gap-4 sm:grid-cols-3 lg:grid-cols-5 mt-4">
      <TrackTile
        v-for="track of tracks"
        :key="track._id"
        :track="track"
        @delete-track="deleteTrack(track._id, track.name)"
        @start-track="startTrack(track._id)"
        @edit-track="editTrack(track._id)" />
    </div>

    <Modal
      :title="editingTrackId ? 'Edit track' : 'Upload track'"
      v-if="isUploadModalVisible"
      @keyup.esc="closeUploadModal"
      @close="closeUploadModal">
      <div class="my-8 flex flex-row justify-between p-2">
        <div>Title</div>
        <input
          v-model="trackName"
          class="w-3/4" />
      </div>
      <div class="my-8">
        <div class="flex flex-row justify-between p-2">
          <div>Partials file</div>
          <input
            type="file"
            @change="handleFileUpload($event)"
            accept="*.txt"
            class="w-3/4" />
        </div>
        <div
          v-if="partialFileDownloadInfo"
          class="flex items-center justify-center gap-2">
          <span>partials.txt</span>
          <a
            :href="`https://sadiss.net/f/${partialFileDownloadInfo.fileName}`"
            download="partials.txt"
            class="text-xl"
            >⤓</a
          >
        </div>
      </div>
      <div class="my-8 flex flex-row justify-between p-2">
        <div>Choir</div>
        <input
          type="checkbox"
          v-model="trackIsChoir"
          class="w-3/4" />
      </div>
      <div class="my-8">
        <div class="flex flex-row justify-between p-2">
          <div>Subtitle files</div>
          <div class="w-3/4">
            <div class="mb-2 flex gap-2">
              <input
                type="number"
                v-model.number="numberOfVoices"
                v-show="trackIsChoir" />
              <input
                type="text"
                placeholder="e.g. en-US, de-DE"
                v-model="ttsLanguages" />
            </div>
            <div
              v-for="voiceLang of voiceLangCombinations"
              class="flex justify-between gap-2">
              <label class="w-1/4">{{ voiceLang[0] }} {{ voiceLang[1] }}</label>
              <input
                type="file"
                @change="handleTtsFileUpload($event, +voiceLang[0], voiceLang[1].toString())"
                accept="*.txt"
                class="w-3/4" />
            </div>
          </div>
        </div>
        <div v-if="ttsFileDownloadInfo">
          <div
            v-for="file of ttsFileDownloadInfo"
            class="flex items-center justify-center gap-2">
            <span>{{ file.origName }}</span>
            <a
              :href="`https://sadiss.net/f/${file.fileName}`"
              :download="`${file.origName}.txt`"
              class="text-xl"
              >⤓
            </a>
          </div>
        </div>
      </div>
      <div class="my-8 flex flex-row justify-between p-2">
        <div>Settings</div>
        <div class="flex w-3/4 flex-col items-start gap-2">
          <div class="flex gap-4">
            <label for="waveform">Waveform</label>
            <select
              name="waveform"
              v-model="trackWaveform">
              <option value="sine">Sine</option>
              <option value="square">Square</option>
              <option value="triangle">Triangle</option>
              <option value="sawtooth">Sawtooth</option>
            </select>
          </div>
          <div class="flex gap-4">
            <label for="ttsRate">TTS Rate</label>
            <input
              name="ttsRate"
              type="number"
              step="0.1"
              min="0.5"
              max="2"
              v-model="trackTtsRate" />
          </div>
        </div>
      </div>
      <div class="my-8 flex flex-row justify-between p-2">
        <div>Private notes</div>
        <textarea
          v-model="trackNotes"
          class="w-3/4" />
      </div>
      <div class="my-8 flex flex-row justify-between p-2">
        <div>Expert mode</div>
        <input
          type="checkbox"
          v-model="expertMode"
          class="w-3/4" />
      </div>
      <div class="flex w-full flex-row justify-center">
	<div v-if="percentCompleted">Uploading... ({{ percentCompleted }}%)</div>
        <Button v-else-if="editingTrackId" @click="upload">Save</Button>
        <Button v-else @click="upload">Upload</Button>
      </div>
    </Modal>

    <!-- QR Code Modal  -->

    <Modal
      v-if="isQrCodeModalVisible"
      title="Generate QR codes"
      @close="isQrCodeModalVisible = false">
      <div class="my-8 flex flex-row justify-between p-2">
        <div>Performance name</div>
        <input
          v-model="performanceName"
          class="w-3/4" />
      </div>
      <div class="mt-8 flex flex-row justify-between p-2">
        <div>Voice count</div>
        <input
          v-model="voiceCount"
          type="number"
          class="w-3/4" />
      </div>
      <div
        v-for="voice in voiceCount"
        class="flex flex-row justify-between p-2">
        <div>Name for voice {{ voice - 1 }}</div>
        <input
          v-model="voiceNames[voice - 1]"
          class="w-3/4" />
      </div>
      <div class="mt-8 flex flex-row justify-between p-2">
        <div>TTS languages</div>
        <input
          v-model="ttsLangs"
          type="text"
          class="w-3/4" />
      </div>
      <div class="mt-8 flex flex-row justify-between p-2">
        <div>Default lang</div>
        <input
          v-model="defaultLanguage"
          type="text"
          class="w-3/4" />
      </div>
      <button @click="generateQrCodes">Generate</button>
    </Modal>

    <!-- QR Codes themselves (not visible to user) -->
    <div
      v-if="areQrCodesVisible"
      class="flex flex-wrap gap-2"
      style="display: none">
      <div v-for="qrCode of qrCodeData">
        <div ref="qrCodeContainer">
          <qrcode-vue
            :value="JSON.stringify(qrCode)"
            :size="200"
            :render-as="'svg'"
            level="H" />
        </div>
      </div>
    </div>
  </div>
</template>
