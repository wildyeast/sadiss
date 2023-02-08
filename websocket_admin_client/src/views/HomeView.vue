<script setup lang="ts">
import { AxiosResponse } from 'axios';
import { ref, onMounted, inject, computed, watch } from 'vue'
import TrackTile from '@/components/TrackTile.vue';

const isUploadModalVisible = ref(false)
const axios: any = inject('axios')

// const API_URL = 'http://localhost:3005'
// const API_URL = 'https://sadiss.net/server'

const trackName = ref('')
const trackNotes = ref('')
const trackIsChoir = ref(false)
const trackWaveform = ref('sine')
const trackTtsRate = ref(1)
let file: File

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

const upload = () => {
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

  axios.post(`${process.env.VUE_APP_API_URL}/upload`, data)
    .then((response: AxiosResponse) => {
      console.log(response.data)
      // Add newly added track to tracks
      tracks.value.push(response.data)
      isUploadModalVisible.value = false
    })
    .catch((error: Error) => {
      console.log(error)
    })

  // Clear TTS file object so they don't get uploaded on next track upload
  for (const ttsFile in ttsFiles) delete ttsFiles[ttsFile];
}

const startTrack = async (id: string) => {
  await fetch(`${process.env.VUE_APP_API_URL}/start-track/${id}/${globalTime.value + 2}`, {
    method: 'POST'
  })
    .then(res => res.json())
    .then(res => console.log(res))
}

const deleteTrack = async (id: string, name: string) => {
  if (confirm('Do you want to delete track: ' + name + '? This cannot be reversed.')) {
    try {
      await fetch(`${process.env.VUE_APP_API_URL}/delete-track/${id}`, {
        method: 'POST'
      })
      tracks.value = tracks.value.filter(track => track._id !== id)
    }
    catch (err) {
      console.log('Failed deleting track with: ', err)
    }
  }
}

const partialFilePath = ref()
const ttsFilePaths = ref<{ name: string, path: string }[]>()
const editTrack = async (id: string) => {
  try {
    const data = await fetch(`${process.env.VUE_APP_API_URL}/get-track/${id}`)
      .then(res => res.json())
    const track = data[0]
    trackName.value = track.name
    trackIsChoir.value = track.mode === 'choir'
    trackNotes.value = track.notes
    trackWaveform.value = track.waveform
    trackTtsRate.value = track.ttsRate

    const partialFileArr = track.files.filter((file: { name: string, path: string }) => file.name === 'partialfile')
    if (partialFileArr.length) {
      partialFilePath.value = partialFileArr[0]
    }

    ttsFilePaths.value = track.files.filter((file: { name: string, path: string }) => file.name.includes('ttsfile'))

    isUploadModalVisible.value = true
  } catch (err) {
    alert('Something went wrong. Error: ' + err)
    return
  }
}

const tracks = ref<{ _id: string, name: string, notes: string }[]>([])
const getTracks = async () => {
  await fetch(`${process.env.VUE_APP_API_URL}/get-tracks`)
    .then(res => res.json())
    .then(data => tracks.value = data.tracks)
    .catch(err => console.log('Failed getting Tracks with: ', err))
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
  <div class="flex flex-col w-[90%] mx-auto">
    <p>{{ globalTime.toFixed(0) }}</p>
    <Button @click="isUploadModalVisible = true">Upload new track</Button>

    <div v-if="tracks.length"
         class="flex flex-col gap-2">
      <TrackTile v-for="track of tracks"
                 :key="track._id"
                 :track="track"
                 @delete-track="deleteTrack(track._id, track.name)"
                 @start-track="startTrack(track._id)"
                 @edit-track="editTrack(track._id)" />
    </div>

    <Modal title="Upload track"
           v-if="isUploadModalVisible"
           @close="isUploadModalVisible = false">
      <div class="flex flex-row my-8 justify-between p-2">
        <div>Title</div>
        <input v-model="trackName"
               class="w-3/4">
      </div>
      <div class="my-8">
        <div class="flex flex-row justify-between p-2">
          <div>Partials file</div>
          <input type="file"
                 @change="handleFileUpload($event)"
                 accept="*.txt"
                 class="w-3/4">
        </div>
        <div v-if="partialFilePath">
          <span>{{ partialFilePath.name }}</span>
          <button>⤓</button>
        </div>
      </div>
      <div class="flex flex-row my-8 justify-between p-2">
        <div>Choir</div>
        <input type="checkbox"
               v-model="trackIsChoir"
               class="w-3/4">
      </div>
      <div class="flex flex-row my-8 justify-between p-2">
        <div>Subtitle files</div>
        <div class="w-3/4">
          <div class="flex gap-2 mb-2">
            <input type="number"
                   v-model.number="numberOfVoices"
                   v-show="trackIsChoir" />
            <input type="text"
                   placeholder="e.g. en-US, de-DE"
                   v-model="ttsLanguages" />
          </div>
          <div v-for="voiceLang of voiceLangCombinations"
               class="flex gap-2 justify-between">
            <label class="w-1/4">{{ voiceLang[0] }} {{ voiceLang[1] }}</label>
            <input type="file"
                   @change="handleTtsFileUpload($event, +voiceLang[0], voiceLang[1].toString())"
                   accept="*.txt"
                   class="w-3/4">
          </div>
        </div>
      </div>
      <div class="flex flex-row my-8 justify-between p-2">
        <div>Settings</div>
        <div class="w-3/4 flex flex-col items-start gap-2">
          <div class="flex gap-4">
            <label for="waveform">Waveform</label>
            <select name="waveform"
                    v-model="trackWaveform">
              <option value="sine">Sine</option>
              <option value="square">Square</option>
              <option value="triangle">Triangle</option>
              <option value="sawtooth">Sawtooth</option>
            </select>
          </div>
          <div class="flex gap-4">
            <label for="ttsRate">TTS Rate</label>
            <input name="ttsRate"
                   type="number"
                   step="0.1"
                   min="0.5"
                   max="2"
                   v-model="trackTtsRate" />
          </div>
        </div>
      </div>
      <div class="flex flex-row my-8 justify-between p-2">
        <div>Private notes</div>
        <textarea v-model="trackNotes"
                  class="w-3/4" />
      </div>
      <div class="flex flex-row w-full justify-center">
        <Button @click="upload">Upload</Button>
      </div>
    </Modal>
  </div>
</template>
