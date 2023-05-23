<script setup lang="ts">
import BaseModal from './BaseModal.vue'
import { ref } from 'vue'

const modal = ref<HTMLDialogElement | null>()

const openModal = () => {
  modal.value?.showModal()
}

const closeModal = () => {
  modal.value?.close()
}

defineExpose({
  openModal,
  closeModal
})
</script>

<template>
  <BaseModal
    ref="modal"
    @close-modal="closeModal">
    <h1 class="text-center text-3xl font-bold text-primary">Add Track to Performance</h1>
  </BaseModal>
</template>
