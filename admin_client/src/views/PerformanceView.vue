<script setup lang="ts">
import { getPerformance } from '@/services/api'
import type { SadissPerformance } from '@/types/types'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

// Get performance id from route
const route = useRoute()
const performanceId = route.params.id
const performance = ref<SadissPerformance>()

onMounted(async () => {
  performance.value = await getPerformance(performanceId as string)
})
</script>
<template>
  <main>
    <div
      v-if="performance"
      class="flex flex-col items-center gap-4">
      <h1 class="text-3xl font-bold">{{ performance.name }}</h1>
      <p>Created by: {{ performance.username }}</p>
    </div>
  </main>
</template>
