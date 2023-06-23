<!-- This is a workaround for flickering issues that happen because we re-render every second to update the globalTime clock -->
<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

const emit = defineEmits(['emitSelection'])

const selectedServer = ref<{ wsUrl: string; httpUrl: string; name: string }[]>([])
const serverOptions = ref<{ wsUrl: string; httpUrl: string; name: string }[]>([
  { wsUrl: 'wss://sadiss.net/ws/', httpUrl: import.meta.env.VITE_APP_API_URL, name: 'Sadiss Live' },
  { wsUrl: 'ws://192.168.0.87:443', httpUrl: 'localhost:3005', name: 'Localhost' }
])

watch(
  () => selectedServer.value,
  (value) => {
    emit('emitSelection', value)
    localStorage.setItem('server', JSON.stringify(value))
  }
)

onMounted(() => {
  const storedServer = localStorage.getItem('server')
  if (storedServer) {
    selectedServer.value = JSON.parse(storedServer)
  }
})
</script>
<template>
  <label
    for="serverSelect"
    class="mr-2"
    >Server:
  </label>
  <select
    v-model="selectedServer"
    class="p-2 text-primary"
    id="serverSelect">
    <option
      v-for="(option, index) in serverOptions"
      :key="index"
      :value="option">
      {{ option.name }}
    </option>
  </select>
</template>
