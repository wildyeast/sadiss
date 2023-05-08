<script setup lang="ts">
import { getPerformances, deletePerformance } from '@/services/api'
import type { SadissPerformance } from '@/types/types'
import { onMounted, ref } from 'vue'
</script>

<template>
  <main>
    <h1>Dashboard</h1>
    <div class="mt-8 flex flex-col items-center gap-4">
      <router-link to="/performances">Performances</router-link>
      <router-link to="/tracks">Tracks</router-link>
    </div>
  </main>
</template>
