<template>
  <main class="flex flex-col items-center">
    <img
      src="https://sadiss.net/wp-content/uploads/2022/07/Sadiss-Logo.png"
      class="mt-10 h-20" />
    <div class="mt-28 flex flex-col items-center">
      <h1 class="text-3xl font-bold">Register</h1>
      <form
        class="mt-8 flex flex-col items-center gap-4"
        @submit.prevent="registerUser">
        <input
          v-model="formData.username"
          type="text"
          placeholder="Username"
          class="w-60 rounded-md border px-4 py-2" />
        <input
          v-model="formData.email"
          type="email"
          placeholder="Email"
          class="mt-2 w-60 rounded-md border px-4 py-2" />
        <input
          v-model="formData.password"
          type="password"
          placeholder="Password"
          class="mt-2 w-60 rounded-md border px-4 py-2" />
        <Button type="submit">Register</Button>
      </form>
      <router-link
        to="/login"
        class="text-sm underline"
        >Go back to login
      </router-link>
    </div>
  </main>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { register } from '../services/api'

const router = useRouter()

const formData = reactive({
  username: '',
  email: '',
  password: ''
})

const registerUser = async () => {
  if (!formData.username || !formData.email || !formData.password) {
    console.error('Username, email, and password are required')
    return
  }
  try {
    const response = await register(formData.username, formData.email, formData.password)
    console.log(`Registered with response: ${response}`)
    router.push({ path: '/login' })
  } catch (error) {
    console.error(`Error registering: ${error}`)
  }
}
</script>
