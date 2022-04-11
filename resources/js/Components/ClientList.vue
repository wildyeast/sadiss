<template>
  <div>
    <div class="flex items-center mb-4">
      <input class="mr-2" type="checkbox" v-model="allPartialsAllDevices" />
      <label for="">All partials to all devices</label>
    </div>
    <div class="flex justify-between">
<<<<<<< HEAD
      <button @click="startTrack" class="border p-2">Send partials to clients</button>
      <button @click="startTrackForReal" class="border p-2">Start track</button>
      <button @click="removeClients" class="border p-2">Remove all registered clients</button>
=======
      <button
        @click="startTrack"
        class="border p-2"
        :class="synchronizing ? 'border-green-400' : 'border-red-400'"
        :disabled="!synchronizing"
      >
        Start track
      </button>
      <div class="flex">
        <button
          @click="synchronizeTimingSrcPosition"
          class="border p-2"
          :disabled="!timingSrcConnected"
        >
          Sync
        </button>
        <div class="border-b border-t border-r p-2">
          {{ timingSrcPosition ? timingSrcPosition : "0.0" }}
        </div>
      </div>
      <button @click="removeClients" class="border p-2">
        Remove all registered clients
      </button>
>>>>>>> master
      <div>
        <button
          @click="getRegisteredClients"
          class="border p-2"
          :class="
            autoGetRegisteredClientsInterval
              ? 'border-b-green-400 border-l-green-400 border-t-green-400'
              : 'border'
          "
        >
          Refresh list
        </button>
        <button
          @click="autoGetRegisteredClients"
          class="border-b border-t border-r p-2"
          :class="
            autoGetRegisteredClientsInterval
              ? 'border-green-400'
              : 'border-b border-t border-r'
          "
        >
          Auto
        </button>
      </div>
    </div>
    <p>IDs of registered clients (Total: {{ registeredClients.length }})</p>
    <div v-for="client of registeredClients" :key="client.id">
      {{ client.id }}
    </div>
  </div>
</template>

<script>
import { useForm } from "@inertiajs/inertia-vue3";
import { onMounted, reactive, ref } from "vue";
import Button from "./Button.vue";
import { TimingProvider } from "timing-provider";
import { TimingObject } from "timing-object";
export default {
  components: { Button },
  props: {
    trackId: String,
  },
  setup(props) {
    const registeredClients = reactive([]);
    const autoGetRegisteredClientsInterval = ref(null);
    let timingProvider = null;
    let timingObj = null;
    let synchronizing = ref(false);
    let timingSrcPosition = ref();
    let timingSrcConnected = ref(false);
    let intervalId = null;
    let allPartialsAllDevices = ref(false);

    onMounted(() => {
      // getRegisteredClients();
      autoGetRegisteredClients();
      timingProvider = new TimingProvider("wss://sadiss.net/zeitquelle");

      // const t1 = performance.now()
      timingProvider.onreadystatechange = () => {
        if (timingProvider.readyState === "open") {
          // console.log("Time elapsed until TP ready: ", performance.now() - t1)
          timingObj = new TimingObject(timingProvider);
          timingSrcConnected.value = true;
        }
      };
    });

    function registerClient() {
      useForm({ performance_id: 1 }).post(`/api/client/create`);
      getRegisteredClients();
    }

    async function synchronizeTimingSrcPosition() {
      if (!synchronizing.value) {
        if (queryTimingObj().velocity != 1) {
          timingObj.update({ velocity: 1 });
          console.log("Set TimingObject velocity to 1.");
        }

        synchronizing.value = true;
        (function query() {
          const q = queryTimingObj();
          if (q.position.toFixed(1) - timingSrcPosition.value != 0) {
            // TODO: Weird calculation, doesn't work with !== for some reason, no time to look into it now
            timingSrcPosition.value = q.position.toFixed(1);
          }
          if (synchronizing.value) {
            window.setTimeout(query, 10);
          }
        })();
      } else {
        synchronizing.value = false;
        timingProvider.update({ velocity: 0, position: 0 });
        timingSrcPosition.value = queryTimingObj().position.toFixed(1);
        window.clearInterval(intervalId);
      }
      console.log("Synchronizing: ", synchronizing.value);
    }

    function queryTimingObj() {
      const q = timingObj.query();
      return q;
    }

    async function startTrack() {
      const calculatedStartingPosition = timingObj.query().position + 5;
      let route;

      if (allPartialsAllDevices.value) {
        route = `/api/track/${props.trackId}/start_all/${calculatedStartingPosition}`;
      } else {
        route = `/api/track/${props.trackId}/start/${calculatedStartingPosition}`;
      }

      console.log("Calculated starting position: ", calculatedStartingPosition);
      const response = await axios.post(route);
      console.log(response.data.data);
    }

<<<<<<< HEAD
    async function startTrackForReal () {
      const response = await axios.post(`/api/track/${props.trackId}/start_real`)
      console.log(response)
    }

    async function getRegisteredClients () {
      const response = await axios.get('/api/client/active')
      registeredClients.splice(0)
=======
    async function getRegisteredClients() {
      const response = await axios.get("/api/client/active");
      registeredClients.splice(0);
>>>>>>> master
      for (const client of response.data) {
        registeredClients.push(client);
      }
    }

    async function autoGetRegisteredClients() {
      console.log(autoGetRegisteredClientsInterval.value);
      if (!autoGetRegisteredClientsInterval.value) {
        await getRegisteredClients();

        autoGetRegisteredClientsInterval.value = window.setInterval(
          async () => {
            await getRegisteredClients();
          },
          2000
        );
      } else {
        autoGetRegisteredClientsInterval.value = null;
      }
    }

    async function removeClients() {
      for (const client of registeredClients) {
        const response = await axios.post(`/api/client/delete/${client.id}`);
        console.log("Removed client with id " + client.id);
      }
      getRegisteredClients();
    }

    return {
      autoGetRegisteredClients,
      autoGetRegisteredClientsInterval,
      registeredClients,
      getRegisteredClients,
      startTrack,
<<<<<<< HEAD
      startTrackForReal,
      removeClients
    }

  }
}
=======
      removeClients,
      synchronizing,
      synchronizeTimingSrcPosition,
      timingSrcPosition,
      timingSrcConnected,
      allPartialsAllDevices,
    };
  },
};
>>>>>>> master
</script>