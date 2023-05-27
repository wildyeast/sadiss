<script setup lang="ts">
import TopBar from './components/TopBar.vue'
import { useRoute } from 'vue-router'
const route = useRoute()
</script>

<template>
  <div class="flex h-screen flex-col bg-primary">
    <TopBar v-if="route.path !== '/login' && route.path !== '/register'" />
    <router-view class="flex-1 lg:mx-10" />
  </div>
</template>
