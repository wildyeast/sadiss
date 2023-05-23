<script setup lang="ts">
import { ref, computed } from 'vue'

const emit = defineEmits<{
  (e: 'toggleAddTrackToPerformanceModal'): void
}>()

const addTrackToPerformanceModal = ref<HTMLDialogElement | null>()

defineExpose({
  showModal: () => addTrackToPerformanceModal.value?.showModal(),
  close: () => addTrackToPerformanceModal.value?.close()
})

const closeDialogOnOutsideClick = (e: MouseEvent) => {
  if (!addTrackToPerformanceModal.value) return
  const dialogDimensions = addTrackToPerformanceModal.value.getBoundingClientRect()
  if (
    e.clientX < dialogDimensions.left ||
    e.clientX > dialogDimensions.right ||
    e.clientY < dialogDimensions.top ||
    e.clientY > dialogDimensions.bottom
  ) {
    emit('toggleAddTrackToPerformanceModal')
  }
}
</script>

<template>
  <dialog
    ref="addTrackToPerformanceModal"
    class="w-full"
    @click="closeDialogOnOutsideClick">
    <h1 class="text-center text-3xl font-bold text-primary">Add Track to Performance</h1>
  </dialog>
</template>
