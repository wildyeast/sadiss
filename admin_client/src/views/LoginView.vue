<script setup lang="ts">
import { reactive, ref } from "vue"
import router from "../router"
import { login } from "../api"

const formData = reactive({
  email: "",
  password: "",
})

const errorMessage = ref("")

async function handleLogin() {
  try {
    await login(formData.email, formData.password)
    await router.push("/")
  } catch (error: any) {
    errorMessage.value = error.message
  }
}
</script>

<template>
  <div class="flex flex-col items-center md:pt-10 w-[300px]">
    <form
      class="flex flex-col items-center gap-4"
      @submit.prevent="handleLogin">
      <input v-model="formData.email" type="email" placeholder="Email" />
      <input
        v-model="formData.password"
        type="password"
        placeholder="Password" />
      <button type="submit" class="button-primary">Login</button>
    </form>
    <p v-if="errorMessage" class="text-danger text-center mt-3">
      {{ errorMessage }}
    </p>
    <!-- <router-link to="/register" class="text-sm underline"
        >No Account? Register!
      </router-link> -->
  </div>
</template>
