<script setup lang="ts">
import TopBar from './components/TopBar.vue'
import { useRoute } from 'vue-router'
const route = useRoute()
</script>

<template>
  <div class="min-h-screen bg-primary">
    <TopBar v-if="route.path !== '/login'" />
    <router-view />
  </div>
</template>
