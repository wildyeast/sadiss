<script setup lang="ts">
import { onMounted } from "vue"
import ActionButtonLink from "../components/ActionButtonLink.vue"
import IconTrash from "../assets/trash.svg"
import { useUserStore } from "../stores/useUserStore"
import { usePerformanceStore } from "../stores/usePerformanceStore"

const userStore = useUserStore()
const loggedInUserIsOwnerOfPerformance = (ownerId: string) => {
  return userStore.loggedInUserId === ownerId
}

const performanceStore = usePerformanceStore()
onMounted(async () => {
  await performanceStore.loadPerformances()
  performanceStore.loading = false
})
</script>

<template>
  <h1>{{ $t("performances") }}</h1>
  <div v-if="performanceStore.loading">{{ $t("loading") }}</div>
  <div v-else class="w-full">
    <div class="list-container">
      <RouterLink
        :to="{
          name: 'PerformanceDetail',
          params: { performanceId: performance._id },
        }"
        v-for="performance of performanceStore.performances"
        :key="performance._id"
        class="list-entry">
        <div class="flex justify-between items-center">
          <div class="flex gap-4 items-center md:text-xl">
            <span>{{ performance.name }}</span>
            <span>
              {{ performance.trackCount }}
              {{ $t("track", performance.trackCount) }}</span
            >
            <span class="md:text-lg"
              >{{ $t("created_by") }}: {{ performance.creator.username }}</span
            >
          </div>
          <!-- Right hand side buttons -->
          <div v-if="loggedInUserIsOwnerOfPerformance(performance.creator._id)">
            <button>
              <IconTrash class="md:h-[24px] md:w-[24px]" />
            </button>
          </div>
        </div>
      </RouterLink>
    </div>
    <ActionButtonLink to="/performances/new" :text="$t('add_performance')" />
  </div>
</template>
