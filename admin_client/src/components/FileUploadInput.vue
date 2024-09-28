<script setup lang="ts">
import { ref, useTemplateRef } from "vue"
import { useI18n } from "vue-i18n"

const props = defineProps<{
  buttonText: string
  accept?: string
  selectedFileName?: string
}>()

const emit = defineEmits<{
  (e: "fileSelected", file: File | null): void
}>()

const { t } = useI18n()

const fileInput = useTemplateRef("fileInput")
const fileNameToDisplay = ref(props.selectedFileName || t("no_file_selected"))

const handleFileUpload = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    const selectedFile = input.files[0]
    fileNameToDisplay.value = selectedFile.name
    emit("fileSelected", selectedFile)
  } else {
    fileNameToDisplay.value = t("no_file_selected")
    emit("fileSelected", null)
  }
}

const triggerFileInputClick = () => {
  fileInput.value?.click()
}
</script>

<template>
  <div class="flex flex-col gap-1">
    <!-- Hidden File Input -->
    <input
      ref="fileInput"
      type="file"
      class="hidden"
      :accept="accept"
      @change="handleFileUpload" />

    <!-- Display Selected File Name -->
    <span>{{ fileNameToDisplay }}</span>

    <!-- Button to Trigger File Input -->
    <button @click.prevent="triggerFileInputClick" class="button-primary">
      {{ buttonText }}
    </button>
  </div>
</template>
