<script setup lang="ts">
import { ref, Ref, computed, onMounted } from "vue"
import IconChevronDown from "../assets/chevron_down.svg"
import IconChevronUp from "../assets/chevron_up.svg"
import IconClientsCount from "../assets/clients_count.svg"
import IconConflictingClientsCount from "../assets/conflicting_clients_count.svg"

const connectedClients: Ref<{ [key: string]: string }> = ref({})

const connectedClientCount = computed(
  () => Object.keys(connectedClients.value).length
)

const clientListDisplayed = ref(false)
const totalConnectedClients = computed(() =>
  Object.values(connectedClients.value).reduce(
    (acc, curr) => acc + parseInt(curr),
    0
  )
)

const voicesWithoutClientsCount = computed(() => {
  return Object.values(connectedClients.value).filter(v => v === "0").length
})

const toggleClientList = () => {
  clientListDisplayed.value = !clientListDisplayed.value

  if (clientListDisplayed.value) {
    generateFakeVoicesAndClients()
  }
}

const generateFakeVoicesAndClients = () => {
  connectedClients.value = {}
  const voices = Math.floor(Math.random() * 16) + 4
  for (let i = 0; i < voices; i++) {
    connectedClients.value[i.toString()] = Math.floor(
      Math.random() * 12
    ).toString()
  }
}

onMounted(() => {
  generateFakeVoicesAndClients()
})
</script>

<template>
  <div
    class="w-full text-white md:flex md:items-end md:flex-col"
    :class="{ 'bg-secondary': clientListDisplayed }">
    <!-- Always visible bar content -->
    <div
      class="flex items-center justify-between w-full z-50 h-[32px] md:w-[250px] md:h-[60px] bg-secondary px-2 md:pr-5 md:justify-end">
      <span class="text-xs md:hidden">Time Sync</span>
      <div class="flex gap-2 md:gap-4">
        <div class="flex items-center gap-1 md:gap-2 md:w-[70px]">
          <IconClientsCount class="h-[17px] w-[17px] md:h-[31px] md:w-[31px]" />
          <span class="text-sm md:text-lg">{{ connectedClientCount }}</span>
        </div>
        <div class="flex items-center gap-1 md:gap-2 md:w-[70px]">
          <IconConflictingClientsCount
            class="h-[16px] w-[16px] md:h-[31px] md:w-[31px]" />
          <span class="text-sm md:text-lg text-silver">{{
            voicesWithoutClientsCount
          }}</span>
        </div>
        <button @click="toggleClientList">
          <IconChevronDown
            v-if="!clientListDisplayed"
            class="h-[13px] w-[13px] icon [&>*]:stroke-[red] md:h-[24px] md:w-[24px]" />
          <IconChevronUp
            v-else
            class="h-[13px] w-[13px] md:h-[24px] md:w-[24px]" />
        </button>
      </div>
    </div>

    <!-- Client list, unfolded on button click -->
    <div
      class="grid grid-cols-[repeat(auto-fill,_70px)] gap-2 bg-secondary md:w-full px-2 md:px-10 md:py-4 justify-center"
      v-show="clientListDisplayed">
      <span
        v-for="client in Object.keys(connectedClients)"
        :key="client"
        :class="{ 'text-silver': connectedClients[client] === '0' }">
        {{ client }}: {{ connectedClients[client] }}
      </span>
    </div>
  </div>
</template>
