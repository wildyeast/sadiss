import { ref } from 'vue'

export function useModal() {
  const modal = ref<HTMLDialogElement | null>()

  const openModal = () => {
    modal.value?.showModal()
  }

  const closeModal = () => {
    modal.value?.close()
  }

  return { modal, openModal, closeModal }
}
