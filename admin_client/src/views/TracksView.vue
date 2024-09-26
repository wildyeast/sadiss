<script setup lang="ts">
import { ref, useTemplateRef } from "vue"
import ActionButtonLink from "../components/ActionButtonLink.vue"
import TrackList from "../components/TrackList.vue"
import IconUpload from "../assets/upload.svg"
import { uploadTrackZip } from "../api";

const handleUploadZip = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!target.files?.length) return

  const file = target.files[0]
  const formData = new FormData()
  formData.append("file", file)

  try {
    await uploadTrackZip(formData)
    // tracks.value = await getTracks()
    // reload page to see the new tracks
    // location.reload()
  } catch (error) {
    console.error("Error uploading zip:", error)
  }
}

const zipFileInput = useTemplateRef("zipFileInput")

const triggerUploadZipClick = () => {
  if(!zipFileInput.value) return
  
  zipFileInput.value.click()
}

const loading = ref(true)
</script>

<template>
  <div class="grid grid-cols-3 w-full px-6">
    <div>
      <!-- Spacer -->
    </div>
    <h1>{{ $t("track", 2) }}</h1>
    <div class="flex justify-end ">
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
  <div v-if="loading" class="w-full flex justify-center">
    {{ $t("loading") }}
  </div>
  <TrackList @hasLoadedTracks="() => (loading = false)" :can-delete="true" />
  <ActionButtonLink v-if="!loading" to="/tracks/new" :text="$t('add_track')" />
</template>
