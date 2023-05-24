<script setup lang="ts">
import { getPerformanceWithTracks } from '@/services/api'
import type { SadissPerformance } from '@/types/types'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

// Get performance id from route
const route = useRoute()
const performanceId = route.params.id
const performance = ref<SadissPerformance>()

onMounted(async () => {
  performance.value = await getPerformanceWithTracks(performanceId as string)
})
</script>
<template>
  <main>
    <div
      v-if="performance"
      class="flex flex-col items-center gap-1 px-2">
      <h1 class="my-2 text-3xl font-bold">{{ performance.name }}</h1>
      <p class="mb-4">Created by: {{ performance.username }}</p>
      <div
        v-for="track in performance.tracks"
        class="flex w-full border p-4">
        <p>{{ track.name }}</p>
      </div>
    </div>
  </main>
</template>
