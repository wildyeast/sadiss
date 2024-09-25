<script setup lang="ts">
import { ref } from "vue"
import TrackList from "../components/TrackList.vue"
import HeadlineWithCancelButton from "../components/HeadlineWithCancelButton.vue"
import { Track } from "../types"
import { addTracksToPerformance } from "../api"
import { useRouter } from "vue-router"

const router = useRouter()

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

const loading = ref(true)
</script>

<template>
  <div class="w-full">
    <HeadlineWithCancelButton
      class="mx-3"
      :to="`/performance/${performanceId}`"
      :text="$t('add_tracks_to_performance')" />
    <div v-if="loading" class="w-full flex justify-center">
      {{ $t("loading") }}
    </div>
    <TrackList
      @has-loaded-tracks="() => (loading = false)"
      :can-delete="false"
      :selected-tracks="selectedTracks" />
    <div v-if="!loading" class="mt-6 flex justify-end mr-3">
      <button
        @click="handleAddTrackToPerformance"
        class="button-primary"
        :disabled="!selectedTracks.length">
        {{ $t("add_selected_tracks") }}
      </button>
    </div>
  </div>
</template>
