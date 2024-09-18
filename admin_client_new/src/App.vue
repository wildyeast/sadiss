<script setup lang="ts">
import { RouterLink } from "vue-router"
import SadissLogo from "./assets/sadiss_logo.svg"
</script>

<template>
  <!-- Top Bar -->
  <div class="h-[130px] flex flex-col items-center justify-center">
    <RouterLink to="/" class="my-[30px]">
      <SadissLogo />
    </RouterLink>
    <nav class="text-sm grid grid-cols-3">
      <!-- Spacer -->
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
  <main>
    <RouterView />
  </main>
</template>
