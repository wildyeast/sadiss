<script setup lang="ts">
import { ref } from 'vue'
import type { Track } from '@/types/types'

const props = defineProps<{
  isPlaying: boolean
  progress: number
  currentChunkIndex: number
  totalChunks: number
  selectedTrack: Track
}>()

defineEmits<{
  startTrack: () => void
  stopTrack: () => void
}>()

const shouldLoop = ref(false)
const toggleLoop = () => {
  if (props.isPlaying) {
    alert('Cannot toggle loop while track is playing')
    return
  }
  shouldLoop.value = !shouldLoop.value
}

const shouldGoToNextTrack = ref(false)
const toggleShouldGoToNextTrack = () => {
  shouldGoToNextTrack.value = !shouldGoToNextTrack.value
}
</script>

<template>
  <div class="flex h-[100px] flex-col items-center justify-between">
    <div>
      <p>{{ selectedTrack.name }}</p>
    </div>
    <div class="flex gap-4">
      <button
        @click="toggleLoop"
        :class="{ 'text-highlight': shouldLoop }">
        <font-awesome-icon
          icon="fa-repeat"
          size="lg" />
      </button>
      <button
        v-if="!isPlaying"
        @click="$emit('startTrack')">
        <font-awesome-icon
          icon="fa-play-circle"
          size="2x" />
      </button>
      <button
        v-else
        @click="$emit('stopTrack')">
        <font-awesome-icon
          icon="fa-stop-circle"
          size="2x" />
      </button>
      <button
        @click="toggleShouldGoToNextTrack"
        :class="{ 'text-highlight': shouldGoToNextTrack }">
        <font-awesome-icon
          icon="fa-forward-fast"
          size="lg" />
      </button>
    </div>
    <!-- Track progress bar -->
    <div class="relative h-[25%] w-full">
      <div
        class="absolute h-full bg-secondary"
        :style="{ width: progress + '%' }" />
      <p
        v-if="totalChunks"
        class="relative h-full text-center text-sm">
        {{ currentChunkIndex }} / {{ totalChunks }}
      </p>
    </div>
  </div>
</template>
