<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { logout } from '@/services/api'
import { useStore } from '@/stores/store'

const store = useStore()

const router = useRouter()

const userMenuDialog = ref<HTMLDialogElement | null>()
let useMenuDialogShown = false

const toggleUserMenu = (event: MouseEvent) => {
  if (!userMenuDialog.value) return

  if (useMenuDialogShown) {
    userMenuDialog.value.close()
    useMenuDialogShown = false
  } else {
    const mouseX = event.clientX
    const mouseY = event.clientY

    userMenuDialog.value.show()
    userMenuDialog.value.style.left = `${mouseX - userMenuDialog.value.clientWidth}px`
    userMenuDialog.value.style.top = `${mouseY}px`
    useMenuDialogShown = true
  }
}

const handleLougout = async () => {
  await logout()
  router.push('/login')
}

// TODO: While this works, it's not ideal, since it forces us to use click.stop on every click
// event that opens a modal.
const closeDialogOnOutsideClick = (e: MouseEvent) => {
  if (!userMenuDialog.value) return
  const dialogDimensions = userMenuDialog.value.getBoundingClientRect()
  if (
    e.clientX < dialogDimensions.left ||
    e.clientX > dialogDimensions.right ||
    e.clientY < dialogDimensions.top ||
    e.clientY > dialogDimensions.bottom
  ) {
    userMenuDialog.value.close()
    useMenuDialogShown = false
  }
}

onMounted(() => {
  document.addEventListener('click', closeDialogOnOutsideClick)
})

onUnmounted(() => {
  document.removeEventListener('click', closeDialogOnOutsideClick)
})
</script>
<template>
  <header
    class="sticky top-0 z-10 mb-6 flex min-h-[80px] w-full items-center justify-between border-b border-light bg-primary px-2 lg:px-10">
    <router-link to="/">
      <img
        src="https://sadiss.net/wp-content/uploads/2022/07/Sadiss-Logo.png"
        class="h-12" />
    </router-link>
    <nav class="relative flex gap-8">
      <router-link to="/tracks">Tracks</router-link>
      <router-link to="/performances">Performances</router-link>
      <button
        @click="toggleUserMenu"
        class="flex items-center gap-3">
        {{ store.userName }}
        <font-awesome-icon icon="fa-user" />
      </button>
      <dialog
        ref="userMenuDialog"
        class="fixed">
        <button
          @click="handleLougout"
          class="text-primary">
          Logout
        </button>
      </dialog>
    </nav>
  </header>
</template>
