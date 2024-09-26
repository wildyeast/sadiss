<script setup lang="ts">
import { RouterLink, useRoute } from "vue-router"
import SadissLogo from "./assets/sadiss_logo.svg"
import { ModalsContainer } from "vue-final-modal"
import { useMCorp } from "./composables/useMCorp"
import { onMounted } from "vue"
import IconUser from "./assets/user.svg"

const route = useRoute()

const { initializeMCorp } = useMCorp()

onMounted(() => {
  initializeMCorp()
})
</script>

<template>
  <!-- Top Bar -->
  <div
    class="h-[130px] md:h-[100px] flex flex-col md:flex-row items-center md:items-start justify-center">
    <RouterLink to="/" class="my-[30px] md:mt-[20px] md:ml-[60px]">
      <SadissLogo />
    </RouterLink>
    <nav
      v-if="!route.meta.hideNavbar"
      class="text-sm grid grid-cols-[1fr_1fr_1fr] md:flex md:justify-end md:h-full md:items-center w-full text-secondary">
      <!-- Spacer for left column of grid -->
      <div />

      <!-- Main links -->
      <div class="flex gap-8 md:gap-4">
        <RouterLink to="/performances">Performances</RouterLink>
        <RouterLink to="/tracks">Tracks</RouterLink>
      </div>

      <!-- User link -->
      <div class="flex justify-center pr-4 md:pl-8">
        <RouterLink to="/user" class="flex gap-2">
          <span>Usr</span>
          <IconUser />
        </RouterLink>
      </div>
    </nav>
  </div>
  <main class="flex flex-col items-center">
    <RouterView />
  </main>
  <ModalsContainer />
</template>
