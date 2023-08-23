<script setup lang="ts">
import TopBar from './components/TopBar.vue'
import { useRoute } from 'vue-router'
const route = useRoute()
</script>

<template>
  <div class="flex h-screen flex-col">
    <TopBar v-if="route.path !== '/login' && route.path !== '/register'" />
    <div class="sticky overflow-y-hidden px-2 pb-2 lg:px-10">
      <router-view />
    </div>
  </div>
</template>
