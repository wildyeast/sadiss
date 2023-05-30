<script setup lang="ts">
import BaseModal from './BaseModal.vue'
import { ref } from 'vue'
import { createPerformance } from '@/services/api'
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
const isPublic = ref(false)
const handleCreatePerformance = async () => {
  await createPerformance(performanceName.value, isPublic.value)
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
          Add Performance
        </button>
      </form>
    </main>
  </BaseModal>
</template>
