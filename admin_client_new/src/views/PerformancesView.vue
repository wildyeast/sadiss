<script setup lang="ts">
import { onMounted, Ref, ref } from "vue"
import { SadissPerformance } from "../types"
import { getPerformances } from "../api"
import ActionButtonLink from "../components/ActionButtonLink.vue"

const performances: Ref<SadissPerformance[]> = ref([])

const loading = ref(true)

onMounted(async () => {
  performances.value = await getPerformances()
  loading.value = false
})
</script>

<template>
  <h1>{{ $t("performances") }}</h1>
  <div v-if="loading">{{ $t("loading") }}</div>
  <div v-else class="w-full">
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
          <span
            >{{ $t("created_by") }}: {{ performance.creator.username }}</span
          >
          <span>
            {{ performance.trackCount }}
            {{ $t("track", performance.trackCount) }}
          </span>
        </div>
      </RouterLink>
    </div>
    <ActionButtonLink to="/performances/new" :text="$t('add_performance')" />
  </div>
</template>
