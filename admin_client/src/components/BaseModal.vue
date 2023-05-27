<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const emit = defineEmits<{
  (e: 'closeModal'): void
}>()

const modal = ref<HTMLDialogElement | null>(null)

const showModal = () => {
  modal.value?.showModal()
}

const close = () => {
  modal.value?.close()
}

// TODO: While this works, it's not ideal, since it forces us to use click.stop on every click
// event that opens a modal.
const closeDialogOnOutsideClick = (e: MouseEvent) => {
  if (!modal.value) return
  const dialogDimensions = modal.value.getBoundingClientRect()
  if (
    e.clientX < dialogDimensions.left ||
    e.clientX > dialogDimensions.right ||
    e.clientY < dialogDimensions.top ||
    e.clientY > dialogDimensions.bottom
  ) {
    emit('closeModal')
  }
}

onMounted(() => {
  document.addEventListener('click', closeDialogOnOutsideClick)
})

onUnmounted(() => {
  document.removeEventListener('click', closeDialogOnOutsideClick)
})

defineExpose({
  showModal,
  close
})
</script>

<template>
  <dialog
    ref="modal"
    class="w-full lg:w-2/3">
    <slot></slot>
  </dialog>
</template>
