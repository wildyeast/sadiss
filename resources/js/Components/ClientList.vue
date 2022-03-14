<template>
  <div>
    <button @click="registerClient">Generate dummy client</button>
    <div>
      <div v-for="client of registeredClients" :key="client.id">
        {{client.id}}
      </div>
    </div>
  </div>
</template>

<script>
import { useForm } from '@inertiajs/inertia-vue3'
import { onMounted, reactive } from 'vue'
export default {
  setup () {

    let registeredClients = reactive([])

    onMounted (() => {
      getRegisteredClients()
    })

    function registerClient () {
      useForm({performance_id: 1}).post(`/api/client/create`)
      getRegisteredClients()
    }

    async function getRegisteredClients () {
      const response = await axios.get('/api/client')
      registeredClients.splice(0)
      for (const client of response.data) {
        registeredClients.push(client)
      }
    }

    return {
      registerClient,
      registeredClients
    }

  }
}
</script>