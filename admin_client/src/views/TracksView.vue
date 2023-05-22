<script setup lang="ts">
import router from '@/router'
import { getTracks, deleteTrack, createTrack } from '@/services/api'
import type { SadissPerformance, Track, Waveform, TtsFilesObject } from '@/types/types'
import axios from 'axios'
import { onMounted, ref, computed } from 'vue'

const tracks = ref<Track[]>([])

let isAddTrackModalOpen = false
const addTrackModal = ref<HTMLDialogElement | null>()

const toggleAddTrackModal = () => {
  isAddTrackModalOpen = !isAddTrackModalOpen
  if (isAddTrackModalOpen) {
    addTrackModal.value?.showModal()
  } else {
    addTrackModal.value?.close()
  }
}

const handleCreateTrack = async () => {
  try {
    const trackData = createTrackData()
    await createTrack(trackData)
  } catch (err) {
    alert(err)
    return
  }
  toggleAddTrackModal()
  tracks.value = await getTracks()
}

const goToTrack = (id: string) => router.push(`/track/${id}`)

const handleDeleteTrack = (id: string) => {
  deleteTrack(id)
  tracks.value = tracks.value.filter((track) => track._id !== id)
}

const trackName = ref('')
const trackNotes = ref('')
const trackIsChoir = ref(false)
const trackWaveform = ref<Waveform>('sine')
const trackTtsRate = ref(1)
let file: File | undefined
const numberOfVoices = ref(2)
const ttsLanguages = ref('en-US, de-DE')
const editingTrackId = ref()
const expertMode = ref(false)

const createTrackData = () => {
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
  return data
}

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

const ttsFiles: TtsFilesObject = {}
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
    onUploadProgress: function (progressEvent: ProgressEvent) {
      percentCompleted.value = Math.round((progressEvent.loaded * 100) / progressEvent.total)
    }
  }

  if (!editingTrackId.value) {
    axios
      // @ts-expect-error TODO: TS complains about FormData
      .post(`${selectedServer.value.httpUrl}/upload`, data, config)
      .then((response) => {
        console.log(response.data)
        // Add newly added track to tracks
        tracks.value.push(response.data)
        percentCompleted.value = null
      })
      .catch((error: Error) => {
        console.log(error)
      })
  } else {
    try {
      // @ts-expect-error TODO: TS complains about FormData
      const res = await axios.patch(`${process.env.VUE_APP_API_URL}/edit/${editingTrackId.value}`, data, config)
      console.log(res.data)
      const trackIdx = tracks.value.map((track) => track._id).indexOf(editingTrackId.value)
      tracks.value[trackIdx] = {
        ...tracks.value[trackIdx],
        ...res.data
      }
    } catch (err) {
      percentCompleted.value = null
      alert('Failed udpating track. ' + err)
    } finally {
      editingTrackId.value = ''
      percentCompleted.value = null
    }
  }

  // Clear partial file so it doesn't get uploaded on next track upload
  file = undefined
  // Clear TTS file object so they don't get uploaded on next track upload
  for (const ttsFile in ttsFiles) delete ttsFiles[ttsFile]
}

const partialFileDownloadInfo = ref()
const ttsFileDownloadInfo = ref<{ origName: string; fileName: string }[]>()

onMounted(async () => {
  tracks.value = await getTracks()
})
</script>

<template>
  <main class="relative mt-3 space-y-1 px-2">
    <h1 class="text-center text-3xl font-bold">Tracks</h1>
    <div
      @click="goToTrack(track._id)"
      v-for="track of tracks"
      :key="track._id"
      class="flex justify-between rounded-sm border border-light p-4">
      <div class="flex flex-col">
        <p class="font-bold">{{ track.name }}</p>
        <p>Created by: {{ track.username }}</p>
      </div>
      <button @click.stop="handleDeleteTrack(track._id)">
        <font-awesome-icon
          icon="fa-trash"
          class="text-danger" />
      </button>
    </div>

    <!-- Open add performance modal -->
    <button
      class="text-white absolute bottom-8 right-10 mt-4 rounded-sm bg-primary"
      @click="toggleAddTrackModal">
      <font-awesome-icon
        icon="fa-plus-circle"
        class="scale-[300%]" />
    </button>

    <!-- Add performance modal -->
    <Teleport to="body">
      <dialog
        ref="addTrackModal"
        class="w-full">
        <form
          class="flex flex-col gap-4 p-4"
          @submit.prevent="handleCreateTrack">
          <h1 class="text-center text-3xl font-bold text-primary">Add Track</h1>
          <!-- Track name -->
          <div class="flex flex-col justify-between p-2">
            <div>Title</div>
            <input
              v-model="trackName"
              class="w-3/4" />
          </div>
          <!-- Partial File Upload -->
          <div>
            <div class="flex flex-col justify-between p-2">
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
                >⤓
              </a>
            </div>
          </div>
          <!-- Choir checkbox -->
          <div class="flex flex-col">
            <div>Choir</div>
            <input
              type="checkbox"
              v-model="trackIsChoir"
              class="w-3/4" />
          </div>
          <!-- SRT file upload -->
          <div>
            <div class="flex flex-col">
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
          <!-- Waveform and TTS rate -->
          <div class="flex flex-col">
            <h2>Settings</h2>
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
          <!-- Expert mode checkbox -->
          <div class="flex flex-col">
            <div>Expert mode</div>
            <input
              type="checkbox"
              v-model="expertMode"
              class="w-3/4" />
          </div>
          <!-- Notes -->
          <div class="flex flex-col">
            <div>Private notes</div>
            <textarea
              v-model="trackNotes"
              class="w-3/4" />
          </div>
          <!-- <div class="flex w-full flex-row justify-center">
            <div v-if="percentCompleted">Uploading... ({{ percentCompleted }}%)</div>
            <Button
              v-else-if="editingTrackId"
              @click="upload"
              >Save</Button
            >
            <Button
              v-else
              @click="upload"
              >Upload</Button
            >
          </div> -->
          <button
            type="submit"
            formmethod="dialog"
            class="text-white rounded-sm bg-primary p-2">
            Add Track
          </button>
        </form>
      </dialog>
    </Teleport>
  </main>
</template>
