<script setup lang="ts">
import { reactive } from "vue"
import router from "../router"
import { login } from "../api"

const formData = reactive({
  email: "",
  password: "",
})

async function handleLogin() {
  await login(formData.email, formData.password)
  await router.push("/")
}
</script>

<template>
  <div class="flex flex-col items-center">
    <form
      class="flex flex-col items-center gap-4"
      @submit.prevent="handleLogin">
      <input v-model="formData.email" type="text" placeholder="Email" />
      <input
        v-model="formData.password"
        type="password"
        placeholder="Password" />
      <button type="submit" class="button-primary">Login</button>
    </form>
    <!-- <router-link to="/register" class="text-sm underline"
        >No Account? Register!
      </router-link> -->
  </div>
</template>
