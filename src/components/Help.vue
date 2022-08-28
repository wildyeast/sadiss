<script setup lang="ts">
import { ref } from 'vue'
import IconArrowRight from '../assets/icons/IconArrowRight.png'
import IconIndexDotFilled from '../assets/icons/IconIndexDotFilled.svg'
import IconIndexDotEmpty from '../assets/icons/IconIndexDotEmpty.svg'
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

const currentStep = ref(0)
const totalSteps = ref(4)

const navigateForward = () => {
  if (currentStep.value >= totalSteps.value) {
    emit('endReached')
  } else {
    currentStep.value += 1
  }
}
</script>

<template>
    <div class="h-full flex flex-col justify-center items-center text-tertiary">
        <div v-if="currentStep === 0"
             class="flex flex-col items-center px-14">
            <h1 class="mb-4">Welcome to SADISS</h1>
            <p class="leading-8">We will guide you through all necessities for becoming one all together sharing the
                united dignified
                wholeness
                of the universe</p>
        </div>
        <div v-else-if="currentStep === 1"
             class="flex flex-col items-center gap-10 p-10">
            <object :data="GraphicSwitchOnAudio"
                    height="200"
                    class="py-2" />
            <p class="leading-8 textlgl">Switch on Audio</p>
        </div>
        <div v-else-if="!isChoirPerformance && currentStep === 2"
             class="flex flex-col items-center gap-10 p-10">
            <object :data="GraphicHeadphonesOff"
                    height="300"
                    class="py-2" />
            <p class="leading-8 text-lg">Unplug headphones or remove bluetooth earplugs</p>
        </div>
        <div v-else-if="isChoirPerformance && currentStep === 2"
             class="flex flex-col items-center gap-10 p-10">
            <object :data="GraphicHeadphonesOn"
                    height="300"
                    class="py-2" />
            <p class="leading-8 text-lg">Plug in headphones or activate bluetooth earplugs</p>
        </div>
        <div v-else-if="currentStep === 3"
             class="flex flex-col items-center gap-10 p-10">
            <object :data="GraphicSwitchOffStandbyMode"
                    height="200"
                    class="py-2" />
            <p class="leading-8 text-lg">Plug in headphones or activate bluetooth earplugs</p>
        </div>
        <div v-else-if="currentStep === 4"
             class="flex flex-col items-center gap-10 p-10">
            <object :data="GraphicKeepOnPhone"
                    height="300"
                    class="py-2" />
            <p class="leading-8 text-lg">Do not swich off phone
                or put phone in standby mode during performance</p>
        </div>
    </div>

    <!-- Nav + Step indicator -->
    <div class="flex flex-col items-center">
        <button @click="navigateForward">
            <object :data="IconArrowRight"
                    height="75"
                    class="py-2" />
        </button>
        <!-- Step indicator -->
        <div class="flex gap-1">
            <object v-for="dot of currentStep + 1"
                    :data="IconIndexDotFilled"
                    height="30"
                    class="py-2" />
            <object v-for="dot of totalSteps - currentStep"
                    :data="IconIndexDotEmpty"
                    height="30"
                    class="py-2" />
        </div>
    </div>

</template>
