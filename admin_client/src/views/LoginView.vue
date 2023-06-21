<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '../services/api'

const router = useRouter()

const formData = reactive({
  email: '',
  password: ''
})

const loginUser = async () => {
  errorMessage.value = ''
  if (!formData.email || !formData.password) {
    console.error('Email and password are required')
    errorMessage.value = 'Email and password are required'
    return
  }
  try {
    await login(formData.email, formData.password)
    await router.push({ path: '/' })
  } catch (error) {
    console.error(`Error logging in: ${error}`)
    errorMessage.value = 'Incorrect credentials'
  }
}

const errorMessage = ref('')
</script>

<template>
  <main class="flex flex-col items-center">
    <img
      src="https://sadiss.net/wp-content/uploads/2022/07/Sadiss-Logo.png"
      class="mt-10 h-20" />
    <div class="mt-28 flex flex-col items-center">
      <h1 class="text-3xl font-bold">Login</h1>
      <p class="error-message my-4 flex h-2 items-center justify-center text-danger">{{ errorMessage }}</p>
      <form
        class="flex flex-col items-center gap-4"
        @submit.prevent="loginUser">
        <input
          v-model="formData.email"
          type="text"
          placeholder="Email"
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
