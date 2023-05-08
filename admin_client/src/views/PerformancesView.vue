<script setup lang="ts">
import { getPerformances, deletePerformance } from '@/services/api'
import type { SadissPerformance } from '@/types/types'
import { onMounted, ref } from 'vue'

const performances = ref<SadissPerformance[]>([])

const handleDeletePerformance = (id: string) => {
  deletePerformance(id)
  performances.value = performances.value.filter((performance) => performance._id !== id)
  console.log(id)
}

onMounted(async () => {
  performances.value = await getPerformances()
  console.log(performances.value)
})
</script>

<template>
  <h1 class="mt-3 text-center text-3xl font-bold">Performances</h1>

  <div class="mt-4 px-2">
    <!-- Performances overview -->
    <section class="space-y-1">
      <div
        v-for="performance of performances"
        :key="performance._id"
        class="flex justify-between rounded-sm border border-light p-4">
        <div>{{ performance.name }} {{ performance.username }}</div>
        <button @click="handleDeletePerformance(performance._id)">Delete</button>
      </div>
    </section>
  </div>
</template>
