<script setup lang="ts">
import { logout } from "../api"
import { useRouter } from "vue-router"

const router = useRouter()

const handleLogout = async () => {
  await logout()
  router.push({ name: "Login" })
}
</script>
<template>
  <div class="mt-10">
    <button @click="handleLogout" class="button-primary">Logout</button>
  </div>
</template>
