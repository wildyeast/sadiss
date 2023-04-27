<script setup lang="ts">
import { useMainStore } from '@/stores/MainStore'
const mainStore = useMainStore()
</script>

<template>
  <div class="flex flex-col items-center gap-4 text-white">
    <h1 class="text-xl">{{ mainStore.performanceName }}</h1>
    <h2 class="text-2xl">{{ mainStore.roleName }}</h2>
  </div>
</template>
