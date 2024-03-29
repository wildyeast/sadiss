<script setup lang="ts">
import BaseModal from './BaseModal.vue'
import { onMounted, ref } from 'vue'
import type { SadissPerformance } from '@/types/types'
import { getOwnPerformances, getPerformances } from '@/services/api'

// Here, the logic concerning opening/closing of the modal can't easily be replaced with
// a composable, since we need to set the selected track id when opening the modal.
// TODO: Find a sane way to handle this.
const modal = ref<HTMLDialogElement | null>()

const selectedTrackId = ref('')
const openModal = (trackId: string) => {
  modal.value?.showModal()
  selectedTrackId.value = trackId
}

const closeModal = () => {
  modal.value?.close()
}

defineExpose({
  openModal,
  closeModal
})

defineEmits<{
  (e: 'addTrackToPerformance', selectedTrackId: string, performanceId: string): void
}>()

const performances = ref<SadissPerformance[]>([])

onMounted(async () => {
  performances.value = await getOwnPerformances()
})
</script>

<template>
  <BaseModal
    ref="modal"
    @close-modal="closeModal">
    <h1 class="text-center text-3xl font-bold text-primary">Add Track to Performance</h1>
    <main
      v-if="performances.length"
      class="flex flex-col items-center gap-1">
      <p class="mb-4 text-primary">Click on the performance you want to add the track to.</p>
      <button
        v-for="performance of performances"
        :key="performance._id"
        class="flex justify-between rounded-sm border border-primary p-2 text-lg hover:bg-secondary"
        @click="$emit('addTrackToPerformance', selectedTrackId, performance._id)">
        <div class="flex flex-col">
          <p class="font-bold text-primary">{{ performance.name }}</p>
        </div>
      </button>
    </main>
    <div
      v-else
      class="flex flex-col items-center text-lg">
      <p class="text-primary">You don't have any performances yet.</p>
      <button
        class="font-bold text-primary hover:underline"
        @click="$router.push('/performances')">
        Create one
      </button>
    </div>
  </BaseModal>
</template>
