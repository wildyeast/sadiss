<script setup lang="ts">
import { createTrack, editTrack } from '@/services/api'
import type { TtsFilesObject, Waveform, Track, TtsFileDownloadInformation } from '@/types/types'
import { ref, computed, watch } from 'vue'
import BaseModal from './BaseModal.vue'
import { useModal } from '@/composables/useModal'
import { VITE_APP_API_URL } from '@/constants'

const { modal } = useModal()

const openModal = (track?: Track) => {
  if (track?._id) {
    trackName.value = track.name
    trackNotes.value = track.notes ? track.notes : ''
    trackIsChoir.value = track.mode === 'choir'
    trackWaveform.value = track.waveform
    trackTtsRate.value = track.ttsRate ? track.ttsRate : 1
    isEditingTrack.value = true
    trackId = track._id
    partialFileDownloadInfo.value = track.partialFile
    if (track.ttsFiles) {
      ttsFileDownloadInfo.value = track.ttsFiles
      numberOfVoices.value = track.ttsFiles.length / ttsLanguages.value.split(',').length
    }
  }
  modal.value?.showModal()
}

const closeModal = () => {
  trackName.value = ''
  trackNotes.value = ''
  trackIsChoir.value = false
  trackWaveform.value = 'sine'
  trackTtsRate.value = 1
  isEditingTrack.value = false
  trackId = ''
  partialFileDownloadInfo.value = undefined
  ttsFileDownloadInfo.value = undefined
  modal.value?.close()
}

defineExpose({
  openModal,
  closeModal
})

const emit = defineEmits<{
  (e: 'trackCreated'): void
  (e: 'toggleAddTrackModal'): void
}>()

const trackName = ref('')
const isPublic = ref(false)
const trackNotes = ref<string>('')
const trackIsChoir = ref(false)
const trackWaveform = ref<Waveform>('sine')
const trackTtsRate = ref<number>(1)
let file: File | undefined
const numberOfVoices = ref(2)
const ttsLanguages = ref('en-US, de-DE')
const isEditingTrack = ref(false)
let trackId = ''

const handleCreateTrack = async () => {
  try {
    const trackData = createTrackData()
    if (isEditingTrack.value) {
      await editTrack(trackId, trackData)
    } else {
      await createTrack(trackData)
    }
  } catch (err) {
    alert(err)
    return
  }
  emit('trackCreated')
}

const createTrackData = () => {
  const data = new FormData()
  data.append('name', trackName.value)
  data.append('notes', trackNotes.value)
  data.append('mode', trackIsChoir.value ? 'choir' : 'nonChoir')
  data.append('waveform', trackWaveform.value)
  data.append('ttsRate', trackTtsRate.value.toString())
  data.append('isPublic', isPublic.value.toString())

  if (file) {
    const fileNameWithoutExtension = file.name.slice(0, '.txt'.length * -1)
    data.append('files', file, `partialfile_${fileNameWithoutExtension}`)
  }
  for (const voice in ttsFiles) {
    for (const lang in ttsFiles[voice]) {
      const ttsFile = ttsFiles[voice][lang]
      const fileNameWithoutExtension = ttsFile.name.slice(0, '.txt'.length * -1)
      data.append('files', ttsFile, `ttsfile_${voice}_${lang}_${fileNameWithoutExtension}`)
    }
  }
  return data
}

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

const partialFileDownloadInfo = ref()
const ttsFileDownloadInfo = ref<TtsFileDownloadInformation[]>()

const voiceLangCombinations = computed(() => {
  // If nonChoir, only allow 1 voice
  const allowedNumberOfVoices = trackIsChoir.value ? numberOfVoices.value : 1
  const combinations = []
  for (let i = 0; i < allowedNumberOfVoices; i++) {
    for (const lang of ttsLanguages.value.split(',')) {
      const combination = <{ voice: number; lang: string; file?: TtsFileDownloadInformation }>{
        voice: i,
        lang: lang.trim()
      }

      // If editing track, add file information to combination for display
      if (ttsFileDownloadInfo.value) {
        console.log(i, lang.trim(), ttsFileDownloadInfo.value)
        const file = ttsFileDownloadInfo.value.find((file) => +file.voice === i && file.lang === lang.trim())
        if (file) {
          combination.file = file
        }
      }

      combinations.push(combination)
    }
  }

  return combinations
})

// Enforce min and max values
watch(trackTtsRate, (newValue) => {
  if (newValue > 2) {
    trackTtsRate.value = 2
  } else if (newValue < 0.5) {
    trackTtsRate.value = 0.5
  }
})
</script>

<template>
  <BaseModal
    ref="modal"
    @close-modal="closeModal">
    <form
      class="flex flex-col gap-4 p-4"
      @submit.prevent="handleCreateTrack">
      <h1 class="text-center text-3xl font-bold text-primary">
        <span v-if="!isEditingTrack">Add Track</span>
        <span v-else>Edit Track</span>
      </h1>
      <!-- Track name -->
      <div class="flex flex-col justify-between p-2">
        <div>Title</div>
        <input
          v-model="trackName"
          class="w-3/4" />
      </div>
      <!-- Public or Private -->
      <div class="flex items-center gap-2">
        <input
          v-model="isPublic"
          type="checkbox"
          id="isPublic"
          name="isPublic"
          class="h-5 w-5 rounded-sm border border-primary p-2" />
        <label for="isPublic">Public</label>
      </div>
      <!-- Partial File Upload -->
      <div class="lg:flex lg:flex-row">
        <div class="flex flex-col justify-between p-2">
          <div>Partials file</div>
          <input
            type="file"
            @change="handleFileUpload($event)"
            accept="*.txt" />
        </div>
        <div
          v-if="partialFileDownloadInfo"
          class="flex items-center justify-center gap-2">
          <span>{{ partialFileDownloadInfo.origName }}</span>
          <a
            :href="`${VITE_APP_API_URL}/f/${partialFileDownloadInfo.fileName}`"
            :download="partialFileDownloadInfo.origName"
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

      <!-- TTS (.srt or .txt) file upload -->
      <div class="lg:flex lg:flex-col">
        <div class="flex flex-col">
          <div>Subtitle files</div>
          <div class="w-3/4">
            <div class="mb-2 flex gap-2">
              <!-- Number of voices -->
              <input
                type="number"
                v-model.number="numberOfVoices"
                v-show="trackIsChoir" />
              <!-- Languages -->
              <input
                type="text"
                placeholder="e.g. en-US, de-DE"
                v-model="ttsLanguages" />
            </div>

            <div
              v-for="voiceLang of voiceLangCombinations"
              class="flex justify-between gap-2">
              <label class="w-1/4">{{ voiceLang.voice }} {{ voiceLang.lang }}</label>
              <input
                type="file"
                @change="handleTtsFileUpload($event, voiceLang.voice, voiceLang.lang)"
                accept="*.txt"
                class="w-3/4" />
              <div v-if="voiceLang.file">
                <span>{{ voiceLang.file.origName }}</span>
                <a
                  :href="`https://sadiss.net/f/${voiceLang.file.fileName}`"
                  :download="`${voiceLang.file.origName}.txt`"
                  class="text-xl"
                  >⤓
                </a>
              </div>
            </div>
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
        <span v-if="!isEditingTrack">Add Track</span>
        <span v-else>Edit Track</span>
      </button>
    </form>
  </BaseModal>
</template>
