<script setup lang="ts">
import { ref } from 'vue'
import IconArrowRight from '../assets/icons/IconArrowRight.svg'
import GraphicSwitchOnAudio from '../assets/icons/GraphicSwitchOnAudio.svg'
import GraphicHeadphonesOff from '../assets/icons/GraphicHeadphonesOff.svg'
import GraphicHeadphonesOn from '../assets/icons/GraphicHeadphonesOn.svg'
import GraphicSwitchOffStandbyMode from '../assets/icons/GraphicSwitchOffStandbyMode.svg'
import GraphicKeepOnPhone from '../assets/icons/GraphicKeepOnPhone.svg'

defineProps({
  isChoirPerformance: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['endReached'])

const currentStep = ref(1)
const totalSteps = ref(5)

const navigateForward = () => {
  if (currentStep.value >= totalSteps.value) {
    emit('endReached')
  } else {
    currentStep.value += 1
  }
}
</script>

<template>
     <div class="h-2/3 my-auto flex flex-col justify-center text-tertiary">
          <div v-if="currentStep === 1"
               class="flex flex-col items-center px-14">
               <h1 class="mb-4">Welcome to SADISS</h1>
               <p class="leading-8">We will guide you through all necessities for becoming one all together
                    sharing the
                    united dignified
                    wholeness
                    of the universe</p>
          </div>
          <div v-else-if="currentStep === 2"
               class="flex flex-col items-center px-10">
               <img :src="GraphicSwitchOnAudio"
                    width="250"
                    class="py-2" />
               <p class="leading-8 textlgl">Switch on Audio</p>
          </div>
          <div v-else-if="!isChoirPerformance && currentStep === 3"
               class="flex flex-col h-1/2 px-6">
               <img :src="GraphicHeadphonesOff"
                    class="w-1/2 mx-auto" />
               <p class="leading-8 text-lg">Unplug headphones or remove bluetooth earplugs</p>
          </div>
          <div v-else-if="isChoirPerformance && currentStep === 3"
               class="flex flex-col h-1/2 px-6">
               <img :src="GraphicHeadphonesOn"
                    class="w-1/2 mx-auto" />
               <p class="leading-8 text-lg">Plug in headphones or activate bluetooth earplugs</p>
          </div>
          <div v-else-if="currentStep === 4"
               class="flex flex-col items-center px-10">
               <img :src="GraphicSwitchOffStandbyMode"
                    height="200"
                    class="py-2" />
               <p class="leading-8 text-lg">Plug in headphones or activate bluetooth earplugs</p>
          </div>
          <div v-else-if="currentStep === 5"
               class="flex flex-col items-center px-10">
               <img :src="GraphicKeepOnPhone"
                    class="w-1/2 mx-auto mb-10" />
               <p class="leading-8 text-lg">Do not swich off phone
                    or put phone in standby mode during performance</p>
          </div>
     </div>

     <!-- Nav + Step indicator -->
     <div class="flex flex-col items-center">
          <button @click="navigateForward">
               <img :src="IconArrowRight"
                    height="25"
                    width="25"
                    class="py-2" />
          </button>
          <!-- Step indicator -->
          <div class="flex">
               <div v-for="(idx, dot) of totalSteps"
                    class="rounded-full w-4 h-4 border-2 border-secondary mx-1"
                    :class="idx <= currentStep ? 'bg-secondary' : ''" />
          </div>
     </div>

</template>
