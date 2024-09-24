<script setup lang="ts">
import { onMounted, Ref, ref } from "vue"
import { SadissPerformance } from "../types"
import { getPerformances } from "../api"
import ActionButtonLink from "../components/ActionButtonLink.vue"

const performances: Ref<SadissPerformance[]> = ref([])

onMounted(async () => {
  performances.value = await getPerformances()
})
</script>

<template>
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
  <ActionButtonLink to="/performances/new" :text="$t('add_performance')" />
</template>
