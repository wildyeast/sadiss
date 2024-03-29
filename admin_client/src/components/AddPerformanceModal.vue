<script setup lang="ts">
import BaseModal from './BaseModal.vue'
import { ref } from 'vue'
import { createPerformance, editPerformance } from '@/services/api'
import { useModal } from '@/composables/useModal'
import type { SadissPerformance } from '@/types/types'

const { modal } = useModal()

const isEditingPerformance = ref(false)
let performanceId = ''
const openModal = (performance?: SadissPerformance) => {
  if (performance?._id) {
    performanceName.value = performance.name
    isPublic.value = performance.isPublic
    performanceId = performance._id
    isEditingPerformance.value = true
  }
  modal.value?.showModal()
}

const closeModal = () => {
  performanceName.value = ''
  isPublic.value = false
  isEditingPerformance.value = false
  modal.value?.close()
}

defineExpose({
  openModal,
  closeModal
})

const emit = defineEmits<{
  (e: 'performanceCreated'): void
}>()

const performanceName = ref('')
const isPublic = ref(false)
const handleCreatePerformance = async () => {
  if (!performanceName.value) return alert('Please enter a name for the performance')

  if (isEditingPerformance.value) {
    await editPerformance(performanceId, performanceName.value, isPublic.value)
    isEditingPerformance.value = false
  } else {
    await createPerformance(performanceName.value, isPublic.value)
  }
  emit('performanceCreated')
}
</script>

<template>
  <BaseModal
    ref="modal"
    @close-modal="closeModal">
    <h1 class="text-center text-3xl font-bold text-primary">
      <span v-if="!isEditingPerformance">Add Performance</span>
      <span v-else>Edit Performance</span>
    </h1>
    <main>
      <form
        class="flex flex-col gap-4 p-4"
        @submit.prevent="handleCreatePerformance">
        <input
          v-model="performanceName"
          type="text"
          placeholder="Name"
          class="rounded-sm border border-primary p-2" />
        <div class="flex items-center gap-2">
          <input
            v-model="isPublic"
            type="checkbox"
            id="isPublic"
            name="isPublic"
            class="h-5 w-5 rounded-sm border border-primary p-2" />
          <label for="isPublic">Public</label>
        </div>
        <button
          type="submit"
          formmethod="dialog"
          class="text-white rounded-sm bg-primary p-2">
          Save
        </button>
      </form>
    </main>
  </BaseModal>
</template>
