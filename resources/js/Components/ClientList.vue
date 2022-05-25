<template>
  <div>
    <div class="flex items-center mb-4">
      <input class="mr-2" type="checkbox" v-model="allPartialsAllDevices" />
      <label for="">All partials to all devices</label>
    </div>
    <div class="flex justify-between">
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
    let motion;

    onMounted(() => {
      // getRegisteredClients();
      autoGetRegisteredClients();
      const mCorpApp = MCorp.app("8844095860530063641")
      mCorpApp.run = () => {
        motion = mCorpApp.motions['shared']
        timingSrcConnected.value = true;
        console.log('MCorpApp:', mCorpApp)
      }
      mCorpApp.init()
      // timingProvider.onreadystatechange = () => {
        // if (timingProvider.readyState === "open") {
          // console.log("Time elapsed until TP ready: ", performance.now() - t1)
          // timingObj = new TimingObject(timingProvider);
          // timingSrcConnected.value = true;
        // }
      // };
    });

    function registerClient() {
      useForm({ performance_id: 1 }).post(`/api/client/create`);
      getRegisteredClients();
    }

    async function synchronizeTimingSrcPosition() {
      if (!synchronizing.value) {
        if (motion.vel != 1) {
          motion.update(null, 1, null);
          console.log("Set TimingObject velocity to 1.");
        }

        synchronizing.value = true;
        (function query() {
          if (motion.pos.toFixed(1) - timingSrcPosition.value != 0) {
            // TODO: Weird calculation, doesn't work with !== for some reason, no time to look into it now
            timingSrcPosition.value = motion.pos.toFixed(1);
          }
          if (synchronizing.value) {
            window.setTimeout(query, 10);
          }
        })();
      } else {
        synchronizing.value = false;
        motion.update(0, 0, 0)
        timingSrcPosition.value = motion.pos.toFixed(1);
      }
      console.log("Synchronizing: ", synchronizing.value);
    }

    async function startTrack() {
      const calculatedStartingPosition = motion.pos + 5;
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

    async function getRegisteredClients() {
      const response = await axios.get("/api/client/active");
      registeredClients.splice(0);
      for (const client of response.data) {
        registeredClients.push(client);
      }
    }

    async function autoGetRegisteredClients() {
      console.log(autoGetRegisteredClientsInterval.value);
      if (!autoGetRegisteredClientsInterval.value) {
        await getRegisteredClients()

        autoGetRegisteredClientsInterval.value = window.setInterval(
          async () => {
            await getRegisteredClients();
          }, 2000
        )
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
      removeClients,
      synchronizing,
      synchronizeTimingSrcPosition,
      timingSrcPosition,
      timingSrcConnected,
      allPartialsAllDevices,
    };
  },
};
</script>