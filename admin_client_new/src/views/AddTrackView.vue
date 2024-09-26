<script setup lang="ts">
import { computed, reactive, ref } from "vue"
import { TtsFileDownloadInformation } from "../types"
import FileUploadInput from "../components/FileUploadInput.vue"
import { storeTrack } from "../api"
import { useRouter } from "vue-router"
import HeadlineWithCancelButton from "../components/HeadlineWithCancelButton.vue"

const router = useRouter()

const formData = reactive({
  name: "",
  partialFile: null as File | null,
  isChoir: false,
  ttsFiles: {} as Record<number, Record<string, File>>,
  notes: "",
  waveform: "sine",
  ttsRate: 1,
  isPublic: false,
})

const handlePartialFileSelected = (file: File | null) => {
  if (!file) {
    return
  }
  formData.partialFile = file
}

// #region Text to Speech
const handleTtsFileSelected = async (
  file: File | null,
  voice: number,
  lang: string
) => {
  if (!file) {
    return
  }
  if (!formData.ttsFiles[voice]) {
    formData.ttsFiles[voice] = {}
  }
  formData.ttsFiles[voice][lang] = file
}

const ttsLanguages = ref("en-US, de-DE")
const numberOfVoices = ref(1)

const voiceLangCombinations = computed(() => {
  // If nonChoir, only allow 1 voice
  const allowedNumberOfVoices = formData.isChoir ? numberOfVoices.value : 1
  const combinations = []
  for (let i = 0; i < allowedNumberOfVoices; i++) {
    for (const lang of ttsLanguages.value.split(",")) {
      const combination = <
        { voice: number; lang: string; file?: TtsFileDownloadInformation }
      >{
        voice: i,
        lang: lang.trim(),
      }

      combinations.push(combination)
    }
  }

  return combinations
})
// #endregion

// #region Store track
const handleAddTrack = async () => {
  try {
    const data = createTrackData()
    await storeTrack(data)
    await router.push("/tracks")
  } catch (error) {
    console.error(error)
  }
}

const createTrackData = () => {
  const data = new FormData()
  data.append("name", formData.name)
  data.append("notes", formData.notes)
  data.append("mode", formData.isChoir ? "choir" : "nonChoir")
  data.append("waveform", formData.waveform)
  data.append("ttsRate", formData.ttsRate.toString())
  data.append("isPublic", formData.isPublic.toString())

  if (formData.partialFile) {
    const fileNameWithoutExtension = formData.partialFile.name.slice(
      0,
      formData.partialFile.name.lastIndexOf(".")
    )
    data.append(
      "files",
      formData.partialFile,
      `partialfile_${fileNameWithoutExtension}`
    )
  }

  for (const voice in formData.ttsFiles) {
    for (const lang in formData.ttsFiles[voice]) {
      const ttsFile = formData.ttsFiles[voice][lang]
      const fileNameWithoutExtension = ttsFile.name.slice(
        0,
        ttsFile.name.lastIndexOf(".")
      )
      data.append(
        "files",
        ttsFile,
        `ttsfile_${voice}_${lang}_${fileNameWithoutExtension}`
      )
    }
  }

  return data
}
// #endregion
</script>
<template>
  <div class="pb-10">
    <HeadlineWithCancelButton
      :to="{ name: 'Tracks' }"
      :text="$t('add_track')" />

    <form>
      <!-- Choir mode -->
      <div class="flex gap-2">
        <div>
          <input type="checkbox" id="isChoir" v-model="formData.isChoir" />
        </div>
        <div class="flex flex-col">
          <label for="isChoir" class="text-black">{{ $t("choir_mode") }}</label>
          <span>{{ $t("choir_mode_description") }}</span>
        </div>
      </div>

      <!-- Public track -->
      <div class="flex gap-2">
        <div>
          <input type="checkbox" id="isPublic" v-model="formData.isPublic" />
        </div>
        <div class="flex flex-col">
          <label for="isPublic" class="text-black">{{
            $t("public_track")
          }}</label>
          <span>{{ $t("public_track_description") }}</span>
        </div>
      </div>

      <!-- Title -->
      <div class="label-and-input">
        <label for="title">{{ $t("title") }}</label>
        <input type="text" id="title" v-model="formData.name" />
      </div>

      <!-- Partial File Upload -->
      <div class="space-y-2">
        <p>{{ $t("partial_file") }}</p>
        <FileUploadInput
          :buttonText="$t('partial_file_upload_button')"
          accept="*.txt"
          @fileSelected="handlePartialFileSelected" />
      </div>

      <!-- Waveform -->
      <div class="label-and-input">
        <label for="waveform">{{ $t("waveform") }}</label>
        <select id="waveform" v-model="formData.waveform" class="input">
          <option value="sine">{{ $t("waveforms.sine") }}</option>
          <option value="square">{{ $t("waveforms.square") }}</option>
          <option value="sawtooth">{{ $t("waveforms.sawtooth") }}</option>
          <option value="triangle">{{ $t("waveforms.triangle") }}</option>
        </select>
      </div>

      <!-- Text to Speech -->
      <div class="space-y-2">
        <p>{{ $t("text_to_speech") }}</p>

        <!-- Languages -->
        <div class="label-and-input">
          <label for="ttsLanguages">{{ $t("languages") }}</label>
          <input
            type="text"
            id="ttsLanguages"
            v-model="ttsLanguages"
            placeholder="e.g. en-US" />
        </div>

        <!-- Number of Voices -->
        <!-- TODO -->

        <!-- TTS File Upload -->
        <div class="space-y-2">
          <div
            v-for="(combination, index) in voiceLangCombinations"
            :key="index">
            <div class="label-and-input mb-4">
              <label :for="`ttsFile-${combination.voice}-${combination.lang}`">
                {{ $t("voice") }} {{ combination.voice + 1 }} -
                {{ combination.lang }}
              </label>
              <FileUploadInput
                :buttonText="$t('tts_file_upload_button')"
                accept="*.srt, *.txt"
                @fileSelected="
                  handleTtsFileSelected(
                    $event,
                    combination.voice,
                    combination.lang
                  )
                " />
            </div>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div>
        <label for="notes">{{ $t("notes") }}</label>
        <textarea id="notes" v-model="formData.notes" class="input" rows="4" />
      </div>

      <!-- Submit button -->
      <div class="flex justify-end">
        <button
          type="submit"
          class="button-primary"
          @click.prevent="handleAddTrack">
          {{ $t("add_track") }}
        </button>
      </div>
    </form>
  </div>
</template>
