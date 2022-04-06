<template>
  <div>
    <div class="flex justify-between">
      <button @click="startTrack" class="border p-2">Start track</button>
      <button @click="synchronizeTimingSrcPosition" class="border p-2">Sync {{ timingSrcPosition }}</button>
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
    let synchronizing = false
    let timingSrcPosition = ref(0)
    let intervalId = null

    onMounted (() => {
      getRegisteredClients()
      autoGetRegisteredClients()
      timingProvider = new TimingProvider('ws://sadiss.net:2276');
      // timingObj = new TimingObject(timingProvider)
    })

    function registerClient () {
      useForm({performance_id: 1}).post(`/api/client/create`)
      getRegisteredClients()
    }

    async function synchronizeTimingSrcPosition () {
      if (!synchronizing) {
        timingObj = new TimingObject(timingProvider)
        if (queryTimingObj().velocity != 1) {
          timingObj.update({ velocity: 1 })
          console.log("Set TimingObject velocity to 1.")
        }

        synchronizing = true
        intervalId = window.setInterval(async () => {
          const q = queryTimingObj()
          timingSrcPosition.value = q.position.toFixed(2)
        }, 10)
      } else {
        window.clearInterval(intervalId)
        synchronizing = false
        timingObj.update({ velocity: 0 })
      }
      console.log("Synchronizing: ", synchronizing)
    }

    function queryTimingObj () {
      const q = timingObj.query()
      return q
    }

    async function startTrack () {
      timingObj.update({position: 0})
      const calculatedStartingPosition = timingSrcPosition.value + 5
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
      removeClients,
      synchronizeTimingSrcPosition,
      timingSrcPosition
    }

  }
}
</script>