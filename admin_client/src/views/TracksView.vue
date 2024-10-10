<script setup lang="ts">
import { onMounted, ref, useTemplateRef } from "vue"
import SearchBar from "../components/SearchBar.vue"
import ActionButtonLink from "../components/ActionButtonLink.vue"
import TrackList from "../components/TrackList.vue"
import IconUpload from "../assets/upload.svg"
import { uploadTrackZip } from "../api"
import { useTrackStore } from "../stores/useTrackStore"
import { useUserStore } from "../stores/useUserStore"

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

const handleSearch = (query: string) => {
  trackStore.filterTracks(query)
}

const userStore = useUserStore()

const FILTER_SETTING_KEY = "tracks_filter"

const filterBy = ref(localStorage.getItem(FILTER_SETTING_KEY) || "all")

const handleFilterChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  if (target.value === "myTracks" && userStore.loggedInUserId) {
    trackStore.filterTracksByUser(userStore.loggedInUserId)
    localStorage.setItem(FILTER_SETTING_KEY, "myTracks")
  } else {
    trackStore.loadTracks()
    localStorage.removeItem(FILTER_SETTING_KEY)
  }
}

onMounted(async () => {
  await trackStore.loadTracks()
  if (filterBy.value === "myTracks" && userStore.loggedInUserId) {
    trackStore.filterTracksByUser(userStore.loggedInUserId)
  }
})
</script>

<template>
  <!-- Header section -->
  <div class="md:grid grid-cols-3 w-full px-6">
    <div class="hidden md:flex items-center">
      <SearchBar @search="handleSearch" />
    </div>
    <h1>{{ $t("track", 2) }}</h1>
    <div class="flex items-center justify-end gap-4 mb-3 md:mb-0">
      <select v-model="filterBy" @change="handleFilterChange">
        <option value="all">{{ $t("all_tracks") }}</option>
        <option value="myTracks">{{ $t("my_tracks") }}</option>
      </select>
      <!-- Upload zip button -->
      <div class="flex items-center">
        <button @click="triggerUploadZipClick">
          <IconUpload />
        </button>
        <input
          ref="zipFileInput"
          id="zip"
          type="file"
          accept=".zip"
          class="hidden"
          @change="handleUploadZip($event)" />
      </div>
      <!-- End of upload zip button -->
    </div>
  </div>

  <!-- Loading section -->
  <div v-if="trackStore.loading" class="w-full flex justify-center">
    {{ $t("loading") }}
  </div>

  <!-- No tracks section -->
  <div v-else-if="trackStore.tracks.length === 0">
    {{ $t("no_tracks_found") }}
  </div>
  <TrackList :noOptions="true" />
  <ActionButtonLink
    v-if="!trackStore.loading"
    to="/tracks/new"
    :text="$t('add_track')" />
</template>
