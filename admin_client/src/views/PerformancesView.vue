<script setup lang="ts">
import { onMounted } from "vue"
import ActionButtonLink from "../components/ActionButtonLink.vue"
import IconTrash from "../assets/trash.svg"
import IconEdit from "../assets/edit.svg"
import { useUserStore } from "../stores/useUserStore"
import { usePerformanceStore } from "../stores/usePerformanceStore"
import { deletePerformance } from "../api/performanceService"

const userStore = useUserStore()
const loggedInUserIsOwnerOfPerformance = (ownerId: string) => {
  return userStore.loggedInUserId === ownerId
}

const handleDeletePerformance = async (performanceId: string) => {
  const confirmDelete = confirm(
    "Are you sure you want to delete this performance?"
  )
  if (!confirmDelete) {
    return
  }

  try {
    const response = await deletePerformance(performanceId)
    if (response.status === 200) {
      performanceStore.performances = performanceStore.performances.filter(
        performance => performance._id !== performanceId
      )
    }
  } catch (error) {
    console.error(error)
  }
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
            <span class="hidden md:block md:text-lg"
              >{{ $t("created_by") }}: {{ performance.creator.username }}</span
            >
          </div>
          <!-- Right hand side buttons -->
          <div
            v-if="loggedInUserIsOwnerOfPerformance(performance.creator._id)"
            class="flex items-center gap-4">
            <RouterLink :to="`/performance/${performance._id}/edit`">
              <IconEdit />
            </RouterLink>
            <button @click.prevent="handleDeletePerformance(performance._id)">
              <IconTrash />
            </button>
          </div>
        </div>
      </RouterLink>
    </div>
    <ActionButtonLink to="/performances/new" :text="$t('add_performance')" />
  </div>
</template>
