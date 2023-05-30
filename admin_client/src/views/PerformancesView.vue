<script setup lang="ts">
import router from '@/router'
import { getPerformances, deletePerformance } from '@/services/api'
import type { SadissPerformance } from '@/types/types'
import { onMounted, ref } from 'vue'
import AddPerformanceModal from '@/components/AddPerformanceModal.vue'
import FixedViewHeader from '@/components/FixedViewHeader.vue'

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
    <FixedViewHeader title="Performances">
      <div class="flex flex-row-reverse">
        <!-- Open add performance modal -->
        <button
          class="rounded-sm bg-light px-4 py-2 font-bold text-primary"
          @click.stop="addPerformanceModal?.openModal">
          Add performance
        </button>
      </div>
    </FixedViewHeader>
    <div class="mt-12 flex-1 space-y-2 overflow-y-scroll pt-16">
      <button
        @click="goToPerformance(performance._id)"
        v-for="performance of performances"
        :key="performance._id"
        class="flex w-full justify-between rounded-sm border border-light p-4">
        <div class="text-start">
          <div class="flex gap-2">
            <p class="font-bold">{{ performance.name }}</p>
            <span v-if="performance.isPublic">
              <font-awesome-icon icon="fa-user-group" />
            </span>
          </div>
          <p>Created by: {{ performance.username }}</p>
        </div>
        <button @click.stop="handleDeletePerformance(performance._id)">
          <font-awesome-icon
            icon="fa-trash"
            class="text-danger" />
        </button>
      </button>
    </div>

    <!-- Add performance modal -->
    <Teleport to="body">
      <AddPerformanceModal
        ref="addPerformanceModal"
        @performance-created="handlePerformanceCreated" />
    </Teleport>
  </main>
</template>
