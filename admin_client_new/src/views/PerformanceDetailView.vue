<script setup lang="ts">
import { computed, onMounted, ref, Ref } from "vue"
import { VueDraggable } from "vue-draggable-plus"
import { SadissPerformance, TrackPerformanceIdAndSortOrder } from "../types"
import { getPerformanceWithTracks, updateTrackPerformanceOrder } from "../api"
import ConnectedClientsList from "../components/ConnectedClientsList.vue"

const props = defineProps<{ id: string }>()

const performance: Ref<SadissPerformance | null> = ref(null)
const tracks = computed(() => performance.value?.tracks)

const selectedTrackIndex = ref(-1)

const onSortOrderUpdate = async () => {
  if (!tracks.value) return

  const trackPerformanceIdsAndSortOrders: TrackPerformanceIdAndSortOrder[] = []
  for (const [index, track] of tracks.value.entries()) {
    trackPerformanceIdsAndSortOrders.push({
      trackPerformanceId: track.trackPerformanceId as string,
      sortOrder: index + 1,
    })
  }

  // Make no track selected to prevent a visual issue where the selected track
  // changes to the one taking its place after it was dragged.
  selectedTrackIndex.value = -1

  await updateTrackPerformanceOrder(trackPerformanceIdsAndSortOrders)
}

onMounted(async () => {
  try {
    const performanceId = props.id as string
    performance.value = await getPerformanceWithTracks(performanceId)
    console.log(performance)
  } catch (error) {
    console.error(error)
  }
})
</script>
<template>
  <ConnectedClientsList />
  <div v-if="performance" class="w-full">
    <h1>{{ performance.name }}</h1>
    <VueDraggable
      v-if="tracks"
      v-model="tracks"
      class="list-container"
      handle=".drag-handle"
      :animation="100"
      @update="onSortOrderUpdate">
      <div
        class="list-entry"
        v-for="track of performance.tracks"
        :key="track._id">
        <div class="flex justify-between">
          <span class="drag-handle">☰</span>
        </div>
        <span>{{ track.name }}</span>
      </div>
    </VueDraggable>
  </div>
</template>
