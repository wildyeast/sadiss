<script setup lang="ts">
import { ref, onMounted } from "vue"
import { mCorpIsInitialized } from "../composables/useMCorp"
import { useWebSocket } from "../composables/useWebSocket"

const { addMessageListener, initializeWebsocketConnection } = useWebSocket()

const usersLoggedInCount = ref(-1)
const clientsLoggedInCount = ref(-1)
const performancesCount = ref(-1)

addMessageListener(data => {
  if (data.message === "adminInfo") {
    // usersLoggedInCount.value = data.adminInfo.usersLoggedInCount
    clientsLoggedInCount.value = data.adminInfo.connectedClientsCount
    performancesCount.value = data.adminInfo.activePerformancesCount
  }
})

onMounted(() => {
  initializeWebsocketConnection()
})
</script>

<template>
  <h1>{{ $t("dashboard") }}</h1>

  <div class="space-y-6">
    <!-- Sync -->
    <div class="infobox">
      <span>{{ $t("time_sync") }}:</span>
      <span>{{
        mCorpIsInitialized
          ? $t("time_sync_status.stable")
          : $t("time_sync_status.unsynced")
      }}</span>
    </div>
    <!-- Users logged in count -->
    <div class="infobox">
      <span>{{ $t("users_logged_in") }}:</span>
      <span class="text-danger">{{ usersLoggedInCount }}</span>
    </div>
    <!-- Clients logged in count -->
    <div class="infobox">
      <span>{{ $t("clients_logged_in") }}:</span>
      <span>{{ clientsLoggedInCount }}</span>
    </div>
    <!-- Performances running -->
    <div class="infobox">
      <span>{{ $t("performances_running") }}:</span>
      <span>{{ performancesCount }}</span>
    </div>
  </div>
</template>

<style scoped>
.infobox {
  @apply flex gap-2 text-sm w-[300px] md:w-[460px] justify-center border border-silver py-2;
}
</style>
