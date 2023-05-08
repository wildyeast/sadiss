<script setup lang="ts">
import router from '@/router'
import { getPerformances, deletePerformance, createPerformance } from '@/services/api'
import type { SadissPerformance } from '@/types/types'
import { onMounted, ref } from 'vue'

const performances = ref<SadissPerformance[]>([])

let isAddPerformanceModalOpen = false
const addPerformanceModal = ref<HTMLDialogElement | null>()

const toggleAddPerformanceModal = () => {
  isAddPerformanceModalOpen = !isAddPerformanceModalOpen
  if (isAddPerformanceModalOpen) {
    addPerformanceModal.value?.showModal()
  } else {
    addPerformanceModal.value?.close()
  }
}

const performanceName = ref('')
const handleCreatePerformance = async () => {
  createPerformance(performanceName.value)
  toggleAddPerformanceModal()
  performances.value = await getPerformances()
}

const goToPerformance = (id: string) => router.push(`/performances/${id}`)

const handleDeletePerformance = (id: string) => {
  deletePerformance(id)
  performances.value = performances.value.filter((performance) => performance._id !== id)
  console.log(id)
}

onMounted(async () => {
  performances.value = await getPerformances()
  console.log(performances.value)
})
</script>

<template>
  <main class="relative mt-3 space-y-1 px-2">
    <h1 class="text-center text-3xl font-bold">Performances</h1>
    <div
      @click="goToPerformance(performance._id)"
      v-for="performance of performances"
      :key="performance._id"
      class="flex justify-between rounded-sm border border-light p-4">
      <div class="flex flex-col">
        <p class="font-bold">{{ performance.name }}</p>
        <p>Created by: {{ performance.username }}</p>
      </div>
      <button @click="handleDeletePerformance(performance._id)">
        <font-awesome-icon
          icon="fa-trash"
          class="text-danger" />
      </button>
    </div>

    <!-- Open add performance modal -->
    <button
      class="text-white absolute bottom-8 right-10 mt-4 rounded-sm bg-primary"
      @click="toggleAddPerformanceModal">
      <font-awesome-icon
        icon="fa-plus-circle"
        class="scale-[300%]" />
    </button>

    <!-- Add performance modal -->
    <Teleport to="body">
      <dialog
        ref="addPerformanceModal"
        class="w-full">
        <form
          class="flex flex-col gap-4 p-4"
          @submit.prevent="handleCreatePerformance">
          <h1 class="text-center text-3xl font-bold text-primary">Add Performance</h1>
          <input
            v-model="performanceName"
            type="text"
            placeholder="Name"
            class="rounded-sm border border-primary p-2" />
          <button
            type="submit"
            class="text-white rounded-sm bg-primary p-2">
            Add Performance
          </button>
        </form>
      </dialog>
    </Teleport>
  </main>
</template>
