<script setup lang="ts">
import { ref, Ref, computed, onMounted } from "vue"
import ChevronDown from "../assets/chevron_down.svg"
import ChevronUp from "../assets/chevron_up.svg"
import ClientsCount from "../assets/clients_count.svg"
import ConflictingClientsCount from "../assets/conflicting_clients_count.svg"

const connectedClients: Ref<{ [key: string]: string }> = ref({})

const connectedClientCount = computed(
  () => Object.keys(connectedClients.value).length
)

const clientListDisplayed = ref(false)

const toggleClientList = () => {
  clientListDisplayed.value = !clientListDisplayed.value
}

onMounted(() => {
  // Simulate connected clients
  connectedClients.value = {
    "0": "12",
    "1": "13",
    "2": "14",
    "3": "15",
    "4": "16",
    "5": "17",
    "6": "18",
    "7": "19",
    "8": "20",
    "9": "21",
    "10": "22",
    "11": "23",
    "12": "24",
    "13": "25",
  }
})
</script>

<template>
  <div class="bg-secondary w-full text-white px-2">
    <!-- Always visible bar content -->
    <div class="flex items-center justify-between w-full z-50 h-[32px]">
      <span class="text-xs">Time Sync</span>
      <div class="flex gap-2">
        <div class="flex items-center gap-1">
          <ClientsCount class="h-[17px] w-[17px]" />
          <span class="text-sm">{{ connectedClientCount }}</span>
        </div>
        <div class="flex items-center gap-1">
          <ConflictingClientsCount class="h-[16px] w-[16px]" />
          <span class="text-sm">X</span>
        </div>
        <button @click="toggleClientList">
          <ChevronDown
            v-if="!clientListDisplayed"
            class="h-[13px] w-[13px] icon [&>*]:stroke-[red]" />
          <ChevronUp v-else class="h-[13px] w-[13px]" />
        </button>
      </div>
    </div>

    <!-- Client list, unfolded on button click -->
    <div class="flex flex-wrap justify-between" v-show="clientListDisplayed">
      <span
        v-for="client in Object.keys(connectedClients)"
        :key="client"
        class="w-[50px]">
        {{ client }}: {{ connectedClients[client] }}
      </span>
    </div>
  </div>
</template>
