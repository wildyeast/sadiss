<script setup lang="ts">
import { ref, useTemplateRef } from "vue"
import { useI18n } from "vue-i18n"
import IconFile from "../assets/file.svg"

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

const handleFileSelection = (file: File | null) => {
  if (file) {
    fileNameToDisplay.value = file.name
    emit("fileSelected", file)
  } else {
    fileNameToDisplay.value = t("no_file_selected")
    emit("fileSelected", null)
  }
}

const handleFileUpload = (e: Event) => {
  const input = e.target as HTMLInputElement
  const selectedFile =
    input.files && input.files.length > 0 ? input.files[0] : null
  handleFileSelection(selectedFile)
}

const handleFileDrop = (e: DragEvent) => {
  const dataTransfer = e.dataTransfer
  const selectedFile =
    dataTransfer && dataTransfer.files.length > 0 ? dataTransfer.files[0] : null
  handleFileSelection(selectedFile)
  isDragging.value = false
}

const triggerFileInputClick = () => {
  fileInput.value?.click()
}

const isDragging = ref(false)
const handleDragOver = () => {
  isDragging.value = true
}

const handleDragLeave = () => {
  isDragging.value = false
}
</script>

<template>
  <div
    class="flex items-center gap-8 md:gap-14"
    @dragover.prevent="handleDragOver"
    @dragleave.prevent="handleDragLeave"
    @drop.prevent="handleFileDrop">
    <IconFile />
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
      <button
        @click.prevent="triggerFileInputClick"
        class="button-primary w-[240px]">
        {{ buttonText }}
      </button>
      <div class="hidden md:block text-sm text-center max-w-[240px]">
        <span v-if="isDragging">
          {{ t("drop_now") }}
        </span>
        <span v-else>
          {{ $t("drag_and_drop_to_upload") }}
        </span>
      </div>
    </div>
  </div>
</template>
