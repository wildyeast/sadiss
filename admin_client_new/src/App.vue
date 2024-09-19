<script setup lang="ts">
import { RouterLink, useRoute } from "vue-router"
import SadissLogo from "./assets/sadiss_logo.svg"

const route = useRoute()
</script>

<template>
  <!-- Top Bar -->
  <div class="h-[130px] flex flex-col items-center justify-center">
    <RouterLink to="/" class="my-[30px]">
      <SadissLogo />
    </RouterLink>
    <nav v-if="!route.meta.hideNavbar" class="text-sm grid grid-cols-3">
      <!-- Spacer for left column of grid -->
      <div />

      <!-- Main links -->
      <div class="flex gap-8">
        <RouterLink to="/performances">Performances</RouterLink>
        <RouterLink to="/tracks">Tracks</RouterLink>
      </div>

      <!-- User link -->
      <div class="flex justify-end pr-4">
        <RouterLink to="/users">Usr</RouterLink>
      </div>
    </nav>
  </div>
  <main class="flex flex-col items-center">
    <RouterView />
  </main>
</template>
