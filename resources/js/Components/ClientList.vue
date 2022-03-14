<template>
  <div>
    <div>
      <button @click="startTrack">Start track</button>
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
    trackId: Number
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

    return {
      registeredClients,
      startTrack
    }

  }
}
</script>