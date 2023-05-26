<script setup lang="ts">
import BaseModal from './BaseModal.vue'
import { onMounted, ref } from 'vue'
import type { SadissPerformance } from '@/types/types'
import { getPerformances } from '@/services/api'

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
  performances.value = await getPerformances()
})
</script>

<template>
  <BaseModal
    ref="modal"
    @close-modal="closeModal">
    <h1 class="text-center text-3xl font-bold text-primary">Add Track to Performance</h1>
    <main>
      <button
        v-for="performance of performances"
        :key="performance._id"
        class="flex justify-between rounded-sm border border-primary p-4"
        @click="$emit('addTrackToPerformance', selectedTrackId, performance._id)">
        <div class="flex flex-col">
          <p class="font-bold text-primary">{{ performance.name }}</p>
        </div>
      </button>
    </main>
  </BaseModal>
</template>
