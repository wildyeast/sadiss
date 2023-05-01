<script setup lang="ts">
import { reactive } from 'vue'
import { login } from '../services/api'

const formData = reactive({
  username: '',
  password: ''
})

const loginUser = async () => {
  if (!formData.username || !formData.password) {
    console.error('Username and password are required')
    return
  }
  try {
    const token = await login(formData.username, formData.password)
    console.log(`Logged in with token: ${token}`)
  } catch (error) {
    console.error(`Error logging in: ${error}`)
  }
}
</script>

<template>
  <main class="flex flex-col items-center">
    <img
      src="https://sadiss.net/wp-content/uploads/2022/07/Sadiss-Logo.png"
      class="mt-10 h-20" />
    <div class="mt-28 flex flex-col items-center">
      <h1 class="text-3xl font-bold">Login</h1>
      <form
        class="mt-8 flex flex-col items-center gap-4"
        @submit.prevent="loginUser">
        <input
          v-model="formData.username"
          type="text"
          placeholder="Username"
          class="w-60 rounded-md border px-4 py-2" />
        <input
          v-model="formData.password"
          type="password"
          placeholder="Password"
          class="mt-2 w-60 rounded-md border px-4 py-2" />
        <Button type="submit">Login</Button>
      </form>
      <router-link
        to="/register"
        class="text-sm underline"
        >No Account? Register!
      </router-link>
    </div>
  </main>
</template>
