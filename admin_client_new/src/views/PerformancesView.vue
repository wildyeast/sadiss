<script setup lang="ts">
import axios from "axios"
import { onMounted, Ref, ref } from "vue"
import ConnectedClientsList from "../components/ConnectedClientsList.vue"
import { SadissPerformance } from "../types"

const performances: Ref<SadissPerformance[]> = ref([])

onMounted(async () => {
  const response = await axios.get<{ performances: SadissPerformance[] }>(
    import.meta.env.VITE_APP_API_URL + "/api/performances",
    {
      withCredentials: true,
    }
  )

  performances.value = response.data.performances
})
</script>

<template>
  <ConnectedClientsList />
  <h1>{{ $t("performances") }}</h1>
  <div class="w-full text-md text-secondary">
    <div
      v-for="performance of performances"
      :key="performance._id"
      class="border-t last:border-b border-secondary p-4">
      <div class="flex justify-between">
        <span>{{ performance.name }}</span>
        <span>{{ $t("created_by") }}: {{ performance.creator.username }}</span>
        <span>
          {{ performance.trackCount }}
          {{ $t("track", performance.trackCount) }}
        </span>
      </div>
    </div>
  </div>
</template>
