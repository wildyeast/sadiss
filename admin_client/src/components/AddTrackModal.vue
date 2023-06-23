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
    isPublic.value = track.isPublic
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
  file.value = undefined
  ttsFiles.value = {}
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
const file = ref<File | undefined>()
const numberOfVoices = ref(2)
const ttsLanguages = ref('en-US, de-DE')
const isEditingTrack = ref(false)
let trackId = ''

const handleCreateTrack = async () => {
  try {
    const trackData = createTrackData()

    if (!trackData) return

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

  if (file.value) {
    const fileNameWithoutExtension = file.value.name.slice(0, '.txt'.length * -1)
    data.append('files', file.value, `partialfile_${fileNameWithoutExtension}`)
  }
  for (const voice in ttsFiles.value) {
    for (const lang in ttsFiles.value[voice]) {
      const ttsFile = ttsFiles.value[voice][lang]
      const fileNameWithoutExtension = ttsFile.name.slice(0, '.txt'.length * -1)
      data.append('files', ttsFile, `ttsfile_${voice}_${lang}_${fileNameWithoutExtension}`)
    }
  }
  return data
}

const handleFileUpload = async (e: Event) => (file.value = (<HTMLInputElement>e.target).files![0])

const ttsFiles = ref<TtsFilesObject>({})
const handleTtsFileUpload = async (e: Event, voice: number, lang: string) => {
  if (!ttsFiles.value[voice]) {
    ttsFiles.value[voice] = {}
  }
  ttsFiles.value[voice][lang] = (<HTMLInputElement>e.target).files![0]
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
      <div class="flex items-center gap-4">
        <div>Title</div>
        <input
          v-model="trackName"
          class="w-full rounded-sm border p-1"
          placeholder="My new track" />
      </div>
      <!-- Public or Private checkbox -->
      <div class="flex items-center gap-2">
        <input
          v-model="isPublic"
          type="checkbox"
          id="isPublic"
          name="isPublic"
          class="h-5 w-5 rounded-sm border border-primary p-2" />
        <label for="isPublic">Publish track to be visible to and usable by anybody</label>
      </div>

      <!-- Choir checkbox -->
      <div class="flex items-center gap-2">
        <input
          v-model="trackIsChoir"
          type="checkbox"
          id="trackIsChoir"
          name="trackIsChoir"
          class="h-5 w-5 rounded-sm border border-primary p-2" />
        <label for="trackIsChoir">Track is for choirs</label>
      </div>

      <hr />

      <!-- Partial File Upload -->
      <div class="lg:flex lg:flex-row">
        <div class="flex justify-between gap-2">
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
      <div
        v-if="file || partialFileDownloadInfo"
        class="flex items-center gap-4">
        <label for="waveform">Waveform</label>
        <!-- @click.stop is necessary here, otherwise the modal closes because of closeDialogOnOutsideClick. Not ideal. -->
        <select
          name="waveform"
          v-model="trackWaveform"
          @click.stop=""
          class="rounded-sm px-2 py-1">
          <option value="sine">Sine</option>
          <option value="square">Square</option>
          <option value="triangle">Triangle</option>
          <option value="sawtooth">Sawtooth</option>
        </select>
      </div>

      <hr />

      <!-- TTS (.srt or .txt) file upload -->
      <div class="lg:flex lg:flex-col">
        <div class="flex flex-col">
          <div>Subtitle files</div>
          <div>
            <div class="mb-2 flex gap-6">
              <!-- Number of voices -->
              <div
                v-show="trackIsChoir"
                class="flex items-center gap-2">
                <label for="numberOfVoices">Number of voices</label>
                <input
                  v-model.number="numberOfVoices"
                  name="numberOfVoices"
                  type="number"
                  class="w-[80px] rounded-sm border p-1 text-center" />
              </div>
              <!-- Languages -->
              <div class="flex items-center gap-2">
                <label for="numberOfVoices">Languages</label>
                <input
                  v-model="ttsLanguages"
                  type="text"
                  placeholder="e.g. en-US, de-DE"
                  class="rounded-sm border p-1" />
              </div>
            </div>

            <div
              v-for="voiceLang of voiceLangCombinations"
              class="mb-1 flex w-full gap-4">
              <label>Voice {{ voiceLang.voice }}, Lang {{ voiceLang.lang }}:</label>
              <input
                type="file"
                @change="handleTtsFileUpload($event, voiceLang.voice, voiceLang.lang)"
                accept="*.txt" />
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
      <!-- TTS rate -->
      <div
        v-if="Object.keys(ttsFiles).length || ttsFileDownloadInfo?.length"
        class="flex w-3/4 flex-col items-start gap-2">
        <div class="flex items-center gap-4">
          <label for="ttsRate">TTS Rate</label>
          <input
            name="ttsRate"
            type="number"
            step="0.1"
            min="0.5"
            max="2"
            v-model="trackTtsRate"
            class="rounded-sm border p-1" />
        </div>
      </div>

      <hr />

      <!-- Notes -->
      <div class="flex items-center gap-4">
        <div>Notes</div>
        <textarea
          v-model="trackNotes"
          class="w-full rounded-sm border p-2"
          placeholder="My notes" />
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
