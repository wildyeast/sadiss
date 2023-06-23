<script setup lang="ts">
import TopBar from './components/TopBar.vue'
import { useRoute } from 'vue-router'
const route = useRoute()
</script>

<template>
  <div class="relativ flex flex-col bg-primary">
    <TopBar
      v-if="route.path !== '/login' && route.path !== '/register'"
      class="fixed left-0 top-0" />
    <router-view class="mt-[80px] h-full flex-1 px-2 pb-2 lg:px-10" />
  </div>
</template>
