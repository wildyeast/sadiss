<script setup lang="ts">
import { computed, onMounted, reactive, ref, useTemplateRef } from "vue"
import { useI18n } from "vue-i18n"
import { TtsFileDownloadInformation } from "../types"

const { t } = useI18n()

const partialFileInput = useTemplateRef("partialFileInput")

const partialsFileNameToDisplay = ref(t("partial_file_upload_no_file"))

const formData = reactive({
  title: "",
  partialFile: null as File | null,
  isChoir: false,
  ttsLanguages: "",
})

const handlePartialFileUpload = async (e: Event) => {
  const input = e.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    formData.partialFile = input.files[0]
    partialsFileNameToDisplay.value = formData.partialFile.name
  } else {
    formData.partialFile = null
    partialsFileNameToDisplay.value = t("partial_file_upload_no_file")
  }
}

const triggerFileInputClick = () => {
  partialFileInput.value?.click()
}

const numberOfVoices = ref(1)

const voiceLangCombinations = computed(() => {
  // If nonChoir, only allow 1 voice
  const allowedNumberOfVoices = formData.isChoir ? numberOfVoices.value : 1
  const combinations = []
  for (let i = 0; i < allowedNumberOfVoices; i++) {
    for (const lang of formData.ttsLanguages.split(",")) {
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

onMounted(() => {
  if (partialFileInput.value) {
    partialFileInput.value.addEventListener("change", handlePartialFileUpload)
  }
})
</script>
<template>
  <div>
    <h1>{{ $t("add_track") }}</h1>

    <form class="text-secondary space-y-6">
      <!-- Title -->
      <div class="label-and-input">
        <label for="title">{{ $t("title") }}</label>
        <input type="text" id="title" v-model="formData.title" class="input" />
      </div>

      <!-- Partial File Upload -->
      <div class="label-and-input">
        <p>{{ $t("partial_file") }}</p>
        <input
          ref="partialFileInput"
          class="hidden"
          type="file"
          @change="handlePartialFileUpload($event)"
          accept="*.txt" />

        <span id="file-name">
          {{ partialsFileNameToDisplay }}
        </span>
        <button @click.prevent="triggerFileInputClick" class="button-primary">
          {{ $t("partial_file_upload_button") }}
        </button>
      </div>

      <!-- Text to Speech -->
      <p>{{ $t("text_to_speech") }}</p>
    </form>
  </div>
</template>

<style scoped>
.label-and-input {
  @apply flex flex-col gap-1;
}
</style>
