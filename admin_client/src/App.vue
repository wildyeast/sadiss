<script setup lang="ts">
import TopBar from './components/TopBar.vue'
import { useRoute } from 'vue-router'
const route = useRoute()
</script>

<template>
  <div class="relative flex h-screen flex-col bg-primary">
    <TopBar v-if="route.path !== '/login' && route.path !== '/register'" />
    <router-view class="h-full flex-1 px-2 pb-2 pt-[100px] lg:px-10" />
  </div>
</template>
