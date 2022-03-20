<template>
  <div>
    <div class="flex flex-col">
      <button @click="startTrack" class="border border-1">Start track</button>
      <button @click="removeClients" class="border border-1">Remove all registered clients</button>
      <button @click="getRegisteredClients" class="border border-1">Refresh list</button>
      <p>IDs of registered clients</p>
      <div v-for="client of registeredClients" :key="client.id">
        {{client.id}}
      </div>
    </div>
  </div>
</template>

<script>
import { useForm } from '@inertiajs/inertia-vue3'
import { onMounted, reactive } from 'vue'
import Button from './Button.vue'
export default {
  components: { Button },
  props: {
    trackId: String
  },
  setup (props) {

    let registeredClients = reactive([])

    onMounted (() => {
      getRegisteredClients()
    })

    function registerClient () {
      useForm({performance_id: 1}).post(`/api/client/create`)
      getRegisteredClients()
    }

    async function startTrack () {
      const response = await axios.post(`/api/track/${props.trackId}/start`)
      console.log(response.data.data)
    }

    async function getRegisteredClients () {
      const response = await axios.get('/api/client')
      registeredClients.splice(0)
      for (const client of response.data) {
        registeredClients.push(client)
      }
    }

    async function removeClients () {
      for (const client of registeredClients) {
        const response = await axios.post(`/api/client/delete/${client.id}`)
        console.log("Removed client with id " + client.id)
      }
      getRegisteredClients()
    }

    return {
      registeredClients,
      getRegisteredClients,
      startTrack,
      removeClients
    }

  }
}
</script>