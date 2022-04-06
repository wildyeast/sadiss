<template>
  <div>
    <div class="flex justify-between">
      <button @click="startTrack" class="border p-2">Start track</button>
      <button @click="removeClients" class="border p-2">Remove all registered clients</button>
      <div>
        <button @click="getRegisteredClients"
                class="border p-2"
                :class="autoGetRegisteredClientsInterval ? 'border-b-red-400 border-l-red-400 border-t-red-400' : 'border'">
                Refresh list
        </button>
        <button @click="autoGetRegisteredClients"
                class="border-b border-t border-r p-2"
                :class="autoGetRegisteredClientsInterval ? 'border-red-400' : 'border-b border-t border-r'">
                Auto
        </button>
      </div>
    </div>
    <p>IDs of registered clients (Total: {{ registeredClients.length }})</p>
    <div v-for="client of registeredClients" :key="client.id">
      {{client.id}}
    </div>
  </div>
</template>

<script>
import { useForm } from '@inertiajs/inertia-vue3'
import { onMounted, reactive, ref } from 'vue'
import Button from './Button.vue'
import { TimingProvider } from 'timing-provider';
import { TimingObject } from 'timing-object';
export default {
  components: { Button },
  props: {
    trackId: String
  },
  setup (props) {

    const registeredClients = reactive([])
    const autoGetRegisteredClientsInterval = ref(true)
    let timingProvider = null
    let timingObj = null

    onMounted (() => {
      getRegisteredClients()
      autoGetRegisteredClients()
      timingProvider = new TimingProvider('ws://sadiss.net:2276');
      timingObj = new TimingObject(timingProvider)
    })

    function registerClient () {
      useForm({performance_id: 1}).post(`/api/client/create`)
      getRegisteredClients()
    }

    async function queryTimingObj () {
      console.log("Quering.")
      console.log("TimingObj: ", timingObj)
      const q = await timingObj.query()
      console.log("Queried TimingObj: ", q)
      return q
    }

    async function startTrack () {
      console.log("Start track pressed.")
      const q = await queryTimingObj()
      console.log("Queried TimingObject: ", q)
      // if (q.velocity !== 1) {
      //   timingObj.update({ velocity: 1 })
      //   console.log("Set TimingObject velocity to 1.")
      // }
      const calculatedStartingPosition = q.position + 5
      console.log("Calculated starting position: ", calculatedStartingPosition)
      const response = await axios.post(`/api/track/${props.trackId}/start/${calculatedStartingPosition}`)
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
      if (!autoGetRegisteredClientsInterval.value) {
        await getRegisteredClients();

        autoGetRegisteredClientsInterval.value = window.setInterval(async () => {
          await getRegisteredClients();
        }, 2000)

      } else {
        autoGetRegisteredClientsInterval.value = null
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