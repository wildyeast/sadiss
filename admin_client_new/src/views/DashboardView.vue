<script setup lang="ts">
import { ref } from "vue"
import { mCorpIsInitialized } from "../composables/useMCorp"

const usersLoggedInCount = ref(-1)
const clientsLoggedInCount = ref(-1)
const performancesCount = ref(-1)
</script>

<template>
  <h1 class="text-lg">{{ $t("dashboard") }}</h1>

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
      <span class="text-danger">{{ clientsLoggedInCount }}</span>
    </div>
    <!-- Performances running -->
    <div class="infobox">
      <span>{{ $t("performances_running") }}:</span>
      <span class="text-danger">{{ performancesCount }}</span>
    </div>
  </div>
</template>

<style scoped>
.infobox {
  @apply flex gap-2 text-sm min-w-[300px] justify-center border border-silver py-2;
}
</style>
