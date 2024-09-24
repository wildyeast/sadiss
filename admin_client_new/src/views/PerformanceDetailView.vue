<script setup lang="ts">
import { computed, onMounted, ref, Ref } from "vue"
import { VueDraggable } from "vue-draggable-plus"
import { SadissPerformance, TrackPerformanceIdAndSortOrder } from "../types"
import {
  getPerformanceWithTracks,
  loadTrackForPlayback,
  updateTrackPerformanceOrder,
} from "../api"
import ConnectedClientsList from "../components/ConnectedClientsList.vue"
import PlayerControls from "../components/PlayerControls.vue"
import { formatTime } from "../utils/formatTime"
import WaveformIcon from "../assets/waveform.svg"
import TtsRateIcon from "../assets/tts_rate.svg"
import ClockIcon from "../assets/clock.svg"
import ModalSetStartTime from "../components/modals/ModalSetStartTime.vue"

const props = defineProps<{ id: string }>()

const performance: Ref<SadissPerformance | null> = ref(null)
const tracks = computed(() => performance.value?.tracks)

const selectedTrackIndex = ref(-1)
const selectedTrackLengthInChunks = ref(-1)

const nextTrack = computed(() => {
  if (selectedTrackIndex.value === -1 || !tracks.value) return
  return tracks.value[selectedTrackIndex.value + 1]
})

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

const handleTrackSelect = async (index: number) => {
  if (selectedTrackIndex.value === index || !tracks.value) return

  selectedTrackLengthInChunks.value = -1

  try {
    selectedTrackIndex.value = index
    selectedTrackLengthInChunks.value = await loadTrackForPlayback(
      tracks.value[index]._id,
      props.id
    )
  } catch (error) {
    console.error(error)
    selectedTrackIndex.value = -1
    selectedTrackLengthInChunks.value = -1
  }
}

const setStartTimeModalDisplayed = ref(false)
const showModalSetStartTime = () => {
  setStartTimeModalDisplayed.value = true
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

    <p
      v-if="selectedTrackIndex > -1 && tracks && tracks[selectedTrackIndex]"
      class="text-center mb-4">
      {{ selectedTrackIndex + 1 }} {{ tracks[selectedTrackIndex].name }}
      <PlayerControls
        :performance-id="id"
        :selected-track="tracks[selectedTrackIndex]"
        :next-track="nextTrack"
        :track-loaded="selectedTrackLengthInChunks > -1"
        :selected-track-length-in-chunks="selectedTrackLengthInChunks" />
    </p>

    <VueDraggable
      v-if="tracks"
      v-model="tracks"
      class="list-container"
      handle=".drag-handle"
      :animation="100"
      @update="onSortOrderUpdate">
      <div
        class="list-entry"
        :class="{ 'bg-secondary text-white': selectedTrackIndex === index }"
        v-for="(track, index) of performance.tracks"
        :key="track._id"
        @click="handleTrackSelect(index)">
        <div class="flex gap-3">
          <div>
            <span class="drag-handle text-xl">☰</span>
          </div>
          <div class="space-y-2">
            <div class="space-x-2 text-md">
              <span>{{ index + 1 }}</span>
              <span>{{ track.name }}</span>
            </div>

            <div class="flex gap-3">
              <!-- Start time -->
              <button class="icon-and-label" @click="showModalSetStartTime()">
                <ClockIcon
                  class="w-[18px] h-[18px]"
                  :class="{
                    '[&>*]:stroke-white': selectedTrackIndex === index,
                  }" />
                <span>{{ formatTime(track.startTime) }}</span>
              </button>

              <!-- Waveform -->
              <div class="icon-and-label">
                <WaveformIcon
                  class="w-[21px]"
                  :class="{
                    '[&>*]:stroke-white': selectedTrackIndex === index,
                  }" />
                <span>{{ $t(`waveforms.${track.waveform}`) }}</span>
              </div>

              <!-- TTS rate -->
              <div v-if="track.ttsRate" class="icon-and-label">
                <TtsRateIcon
                  class="w-[18px] h-[18px]"
                  :class="{
                    '[&>*]:fill-white': selectedTrackIndex === index,
                  }" />
                <span>{{ track.ttsRate }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </VueDraggable>
    <ModalSetStartTime
      v-if="tracks && selectedTrackIndex > -1"
      v-model="setStartTimeModalDisplayed"
      @confirm="setStartTimeModalDisplayed = false"
      :trackperformance-id="tracks[selectedTrackIndex].trackPerformanceId"
      :title="`Set start time for track ${tracks[selectedTrackIndex].name}`" />
  </div>
</template>

<style scoped>
.icon-and-label {
  @apply flex gap-2 items-center text-silver text-sm;
}
</style>
