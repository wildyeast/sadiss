<script setup lang="ts">
import { useTemplateRef } from "vue"
import ActionButtonLink from "../components/ActionButtonLink.vue"
import TrackList from "../components/TrackList.vue"
import IconUpload from "../assets/upload.svg"
import { uploadTrackZip } from "../api"
import { useTrackStore } from "../stores/useTrackStore"

const trackStore = useTrackStore()

const handleUploadZip = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!target.files?.length) return

  const file = target.files[0]
  const formData = new FormData()
  formData.append("file", file)

  try {
    await uploadTrackZip(formData)
    trackStore.loadTracks()
  } catch (error) {
    console.error("Error uploading zip:", error)
  }
}

const zipFileInput = useTemplateRef("zipFileInput")

const triggerUploadZipClick = () => {
  if (!zipFileInput.value) return

  zipFileInput.value.click()
}
</script>

<template>
  <div class="grid grid-cols-3 w-full px-6">
    <div>
      <!-- Spacer -->
    </div>
    <h1>{{ $t("track", 2) }}</h1>
    <div class="flex justify-end">
      <div class="flex items-center">
        <button @click="triggerUploadZipClick"><IconUpload /></button>
        <input
          ref="zipFileInput"
          id="zip"
          type="file"
          accept=".zip"
          class="hidden"
          @change="handleUploadZip($event)" />
      </div>
    </div>
  </div>
  <div v-if="trackStore.loading" class="w-full flex justify-center">
    {{ $t("loading") }}
  </div>
  <TrackList :noOptions="true" />
  <ActionButtonLink
    v-if="!trackStore.loading"
    to="/tracks/new"
    :text="$t('add_track')" />
</template>
