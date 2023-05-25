<script setup lang="ts">
import type { Track } from '@/types/types'

defineProps<{
  isPlaying: boolean
  progress: number
  currentChunkIndex: number
  totalChunks: number
  selectedTrack?: Track
}>()

defineEmits<{
  startTrack: () => void
  stopTrack: () => void
}>()
</script>

<template>
  <div class="flex h-[100px] flex-col items-center justify-between">
    <div>
      <p>{{ selectedTrack?.name }}</p>
    </div>
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
