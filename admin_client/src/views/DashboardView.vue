<script setup lang="ts">
import { getPerformances, createPerformance } from '@/services/api'
import { onMounted } from 'vue'

// Create performance
const submitPerformance = async () => {
  try {
    await createPerformance({ name: 'test' })
  } catch (error) {
    console.error(`Error creating performance: ${error}`)
  }
}

onMounted(async () => {
  const performances = await getPerformances()
  console.log(performances)
})
</script>

<template>
  <h1>Dashboard</h1>
  <button @click="submitPerformance">Check</button>
</template>
