<script setup lang="ts">
import router from '@/router'
import { getPerformances, deletePerformance } from '@/services/api'
import type { SadissPerformance } from '@/types/types'
import { computed, onMounted, ref } from 'vue'
import AddPerformanceModal from '@/components/AddPerformanceModal.vue'
import FixedViewHeader from '@/components/FixedViewHeader.vue'
import { useStore } from '@/stores/store'

const store = useStore()

const performances = ref<SadissPerformance[]>([])
const filterPerformancesBy = ref<'all' | 'own' | 'public'>()

const performancesToDisplay = computed(() => {
  switch (filterPerformancesBy.value) {
    case 'all':
      localStorage.setItem('filterPerformancesBy', 'all')
      return performances.value
    case 'own':
      localStorage.setItem('filterPerformancesBy', 'own')
      return performances.value.filter((performance) => performance.creator.username === store.userName)
    case 'public':
      localStorage.setItem('filterPerformancesBy', 'public')
      return performances.value.filter((performance) => performance.isPublic)
  }
})

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
  const filterPerformancesByFromLocalStorage = localStorage.getItem('filterPerformancesBy')
  if (filterPerformancesByFromLocalStorage) {
    filterPerformancesBy.value = filterPerformancesByFromLocalStorage as 'all' | 'own' | 'public'
  } else {
    filterPerformancesBy.value = 'all'
  }
})
</script>

<template>
  <main class="flex flex-col">
    <FixedViewHeader title="Performances">
      <div class="flex flex-row-reverse gap-2">
        <!-- Open add performance modal -->
        <button
          class="rounded-sm bg-light px-4 py-2 font-bold text-primary"
          @click.stop="addPerformanceModal?.openModal">
          Add performance
        </button>
        <select
          v-model="filterPerformancesBy"
          class="rounded-sm bg-light px-4 py-2 font-bold text-primary">
          <option value="all">All performances</option>
          <option value="own">My performances</option>
          <option value="public">Public performances</option>
        </select>
      </div>
    </FixedViewHeader>
    <div class="mt-12 flex-1 space-y-2 overflow-y-scroll pt-16">
      <button
        @click="goToPerformance(performance._id)"
        v-for="performance of performancesToDisplay"
        :key="performance._id"
        class="flex w-full justify-between rounded-sm border border-light p-4">
        <span class="text-start">
          <span class="flex gap-2">
            <span class="font-bold">{{ performance.name }}</span>
            <span v-if="performance.isPublic">
              <font-awesome-icon icon="fa-user-group" />
            </span>
          </span>
          <span>Created by: {{ performance.creator.username }}</span>
        </span>
        <div class="flex gap-4">
          <button
            v-if="performance.creator.username === store.userName"
            @click.stop="handleDeletePerformance(performance._id)">
            <font-awesome-icon
              icon="fa-trash"
              class="text-danger"
              size="lg" />
          </button>
          <button
            v-if="performance.creator.username === store.userName"
            @click.stop="addPerformanceModal?.openModal(performance)"
            title="Edit performance">
            <font-awesome-icon
              icon="fa-edit"
              size="lg" />
          </button>
        </div>
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
