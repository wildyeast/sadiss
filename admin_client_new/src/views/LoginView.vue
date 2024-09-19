<script setup lang="ts">
import axios from "axios"
import { reactive } from "vue"
import router from "../router"

const formData = reactive({
  email: "",
  password: "",
})

async function login() {
  await axios.post<{ token: string }>(
    `${import.meta.env.VITE_APP_API_URL}/login`,
    {
      email: formData.email,
      password: formData.password,
    },
    {
      withCredentials: true,
    }
  )

  await router.push("/")
}
</script>

<template>
  <div class="flex flex-col items-center">
    <form class="flex flex-col items-center gap-4" @submit.prevent="login">
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
