<template>
  <div>
    <div class="flex justify-between">
      <button @click="startTrack" class="border p-2">Start track</button>
      <button @click="removeClients" class="border p-2">Remove all registered clients</button>
      <div>
        <button @click="getRegisteredClients" class="border border-dashed p-2">Refresh list</button>
        <button @click="autoGetRegisteredClients"
                class="border-b border-t border-r border-solid p-2 bg-slate-700"
                :class="autoGetRegisteredClientsInterval ? 'border-red-400' : 'border-red-100'">
                Auto
        </button>
      </div>
    </div>
    <p>IDs of registered clients</p>
    <div v-for="client of registeredClients" :key="client.id">
      {{client.id}}
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
    let autoGetRegisteredClientsInterval = null

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
      const response = await axios.get('/api/client/active')
      registeredClients.splice(0)
      for (const client of response.data) {
        registeredClients.push(client)
      }
    }

    async function autoGetRegisteredClients() {
      if (!autoGetRegisteredClientsInterval) {
        await getRegisteredClients();

        autoGetRegisteredClientsInterval = window.setInterval(async () => {
          await getRegisteredClients();
        }, 2000)


      } else {
        autoGetRegisteredClientsInterval = null
      }
      console.log(123)
    }

    async function removeClients () {
      for (const client of registeredClients) {
        const response = await axios.post(`/api/client/delete/${client.id}`)
        console.log("Removed client with id " + client.id)
      }
      getRegisteredClients()
    }

    return {
      autoGetRegisteredClients,
      autoGetRegisteredClientsInterval,
      registeredClients,
      getRegisteredClients,
      startTrack,
      removeClients
    }

  }
}
</script>