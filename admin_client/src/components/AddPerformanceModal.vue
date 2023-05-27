<script setup lang="ts">
import BaseModal from './BaseModal.vue'
import { ref } from 'vue'
import { createPerformance, getPerformances } from '@/services/api'
import { useModal } from '@/composables/useModal'

const { modal, openModal, closeModal } = useModal()
defineExpose({
  openModal,
  closeModal
})

const emit = defineEmits<{
  (e: 'performanceCreated'): void
}>()

const performanceName = ref('')
const handleCreatePerformance = async () => {
  await createPerformance(performanceName.value)
  emit('performanceCreated')
}
</script>

<template>
  <BaseModal
    ref="modal"
    @close-modal="closeModal">
    <h1 class="text-center text-3xl font-bold text-primary">Add Performance</h1>
    <main>
      <form
        class="flex flex-col gap-4 p-4"
        @submit.prevent="handleCreatePerformance">
        <input
          v-model="performanceName"
          type="text"
          placeholder="Name"
          class="rounded-sm border border-primary p-2" />
        <button
          type="submit"
          formmethod="dialog"
          class="text-white rounded-sm bg-primary p-2">
          Add Performance
        </button>
      </form>
    </main>
  </BaseModal>
</template>
