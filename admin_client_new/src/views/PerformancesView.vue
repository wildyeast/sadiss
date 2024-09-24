<script setup lang="ts">
import { onMounted, Ref, ref } from "vue"
import ConnectedClientsList from "../components/ConnectedClientsList.vue"
import { SadissPerformance } from "../types"
import { getPerformances } from "../api"

const performances: Ref<SadissPerformance[]> = ref([])

onMounted(async () => {
  performances.value = await getPerformances()
})
</script>

<template>
  <ConnectedClientsList />
  <h1>{{ $t("performances") }}</h1>
  <div class="list-container">
    <RouterLink
      :to="{
        name: 'PerformanceDetail',
        params: { id: performance._id },
      }"
      v-for="performance of performances"
      :key="performance._id"
      class="list-entry">
      <div class="flex justify-between">
        <span>{{ performance.name }}</span>
        <span>{{ $t("created_by") }}: {{ performance.creator.username }}</span>
        <span>
          {{ performance.trackCount }}
          {{ $t("track", performance.trackCount) }}
        </span>
      </div>
    </RouterLink>
  </div>
</template>
