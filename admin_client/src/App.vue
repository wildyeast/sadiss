<script setup lang="ts">
import TopBar from './components/TopBar.vue'
import { useRoute } from 'vue-router'
const route = useRoute()
</script>

<template>
  <div class="flex h-screen flex-col">
    <TopBar v-if="route.path !== '/login' && route.path !== '/register'" />
    <div class="sticky overflow-y-hidden pb-2">
      <router-view />
    </div>
  </div>
</template>
