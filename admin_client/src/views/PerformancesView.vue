<script setup lang="ts">
import router from '@/router'
import { getPerformances, deletePerformance } from '@/services/api'
import type { SadissPerformance } from '@/types/types'
import { onMounted, ref } from 'vue'
import AddPerformanceModal from '@/components/AddPerformanceModal.vue'

const performances = ref<SadissPerformance[]>([])

const addPerformanceModal = ref<typeof AddPerformanceModal | null>()

const goToPerformance = (id: string) => router.push(`/performances/${id}`)

const handleDeletePerformance = (id: string) => {
  if (!confirm('Are you sure you want to delete this performance?')) return
  deletePerformance(id)
  performances.value = performances.value.filter((performance) => performance._id !== id)
}

const handlePerformanceCreated = async () => {
  addPerformanceModal?.value?.closeModal()
  performances.value = await getPerformances()
}

onMounted(async () => {
  performances.value = await getPerformances()
})
</script>

<template>
  <main class="flex flex-col">
    <h1 class="text-center text-3xl font-bold">Performances</h1>
    <div class="mt-6 flex-1 space-y-2 overflow-y-scroll">
      <button
        @click="goToPerformance(performance._id)"
        v-for="performance of performances"
        :key="performance._id"
        class="flex w-full justify-between rounded-sm border border-light p-4">
        <div class="text-start">
          <p class="font-bold">{{ performance.name }}</p>
          <p>Created by: {{ performance.username }}</p>
        </div>
        <button @click.stop="handleDeletePerformance(performance._id)">
          <font-awesome-icon
            icon="fa-trash"
            class="text-danger" />
        </button>
      </button>
    </div>

    <!-- Open add performance modal -->
    <button
      class="text-white absolute bottom-8 right-10 mt-4 rounded-sm bg-primary"
      @click.stop="addPerformanceModal?.openModal()">
      <font-awesome-icon
        icon="fa-plus-circle"
        class="scale-[300%]" />
    </button>

    <!-- Add performance modal -->
    <Teleport to="body">
      <AddPerformanceModal
        ref="addPerformanceModal"
        @performance-created="handlePerformanceCreated" />
    </Teleport>
  </main>
</template>
