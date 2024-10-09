<script setup lang="ts">
import { ref } from "vue"
import TrackList from "../components/TrackList.vue"
import HeadlineWithCancelButton from "../components/HeadlineWithCancelButton.vue"
import SearchBar from "../components/SearchBar.vue"
import { Track } from "../types"
import { addTracksToPerformance } from "../api"
import { useRouter } from "vue-router"
import { useTrackStore } from "../stores/useTrackStore"
import IconCross from "../assets/cross.svg"

const router = useRouter()

const { loading, filterTracks } = useTrackStore()

const props = defineProps<{ performanceId: string }>()

const selectedTracks = ref<Track[]>([])

const handleAddTrackToPerformance = async () => {
  try {
    await addTracksToPerformance(
      props.performanceId,
      selectedTracks.value.map(track => track._id)
    )
    router.push(`/performance/${props.performanceId}`)
  } catch (error) {
    console.error(error)
  }
}
</script>

<template>
  <div class="w-full">
    <div
      class="hidden md:grid grid-cols-3 items-center px-5 w-full justify-between">
      <SearchBar @search="filterTracks" />
      <h1>{{ $t("add_tracks_to_performance") }}</h1>
      <button
        @click="router.push(`/performance/${performanceId}`)"
        class="flex justify-end">
        <IconCross class="h-[20px]" />
      </button>
    </div>
    <HeadlineWithCancelButton
      class="md:hidden"
      :to="`/performance/${performanceId}`"
      :text="$t('add_tracks_to_performance')" />
    <div class="md:hidden p-3 pt-0">
      <SearchBar @search="filterTracks" />
    </div>
    <div v-if="loading" class="w-full flex justify-center">
      {{ $t("loading") }}
    </div>
    <TrackList :noOptions="false" :selected-tracks="selectedTracks" />
    <div v-if="!loading" class="mt-6 flex justify-end mr-3 pb-10">
      <button
        @click="handleAddTrackToPerformance"
        class="button-primary"
        :disabled="!selectedTracks.length">
        {{ $t("add_selected_tracks") }}
      </button>
    </div>
  </div>
</template>
