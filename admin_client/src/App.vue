<script setup lang="ts">
import TopBar from "./components/TopBar.vue"
import { ModalsContainer } from "vue-final-modal"
import { useMCorp } from "./composables/useMCorp"
import { onMounted } from "vue"
import { useWebSocket } from "./composables/useWebSocket"
import { TOP_BAR_HEIGHT_MOBILE, TOP_BAR_HEIGHT_DESKTOP } from "./constants"

const { initializeMCorp } = useMCorp()
const { initializeWebsocketConnection } = useWebSocket()

onMounted(() => {
  initializeMCorp()
  initializeWebsocketConnection()
})
</script>

<template>
  <div class="flex h-screen flex-col">
    <TopBar
      :class="`fixed top-0 left-0 w-full z-50 h-[${TOP_BAR_HEIGHT_MOBILE}px] md:h-[${TOP_BAR_HEIGHT_DESKTOP}px]`" />
    <main
      :class="`flex flex-col  items-center pt-[${TOP_BAR_HEIGHT_MOBILE}px] md:pt-[${TOP_BAR_HEIGHT_DESKTOP}px]`">
      <RouterView />
    </main>
  </div>
  <ModalsContainer />
</template>
