<script setup lang="ts">
import { useMainStore } from '@/stores/MainStore'
const mainStore = useMainStore()
</script>

<template>
  <div class="flex flex-col items-center">
    <h1 class="text-center text-xl text-highlight">{{ mainStore.performanceName }}</h1>
    <h2 class="text-center text-lg text-highlight">{{ mainStore.roleName }}</h2>
    <h2
      v-if="mainStore.selectedLanguage"
      class="text-center text-lg text-highlight">
      Language: {{ mainStore.selectedLanguage.lang }}
    </h2>
  </div>
</template>
