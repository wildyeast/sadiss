<script setup lang="ts">
import Player from '../Player'
import { onMounted, ref } from 'vue';
import IconStartCalibration from '../assets/icons/IconStartCalibration.svg'
import IconStopCalibration from '../assets/icons/IconStopCalibration.svg'
import IconArrowLeft from '../assets/icons/IconArrowLeft.svg'
import IconArrowRight from '../assets/icons/IconArrowRight.svg'

const emit = defineEmits(['calibrationFinished'])
const props = defineProps(['motion'])

let beepIntervalId: NodeJS.Timer;
let player: Player;

const calibrating = ref(false)
const calibratedLatency = ref(0.00)
const userHoldingButton = ref(false)

const startCalibration = async () => {
  player = new Player();

  const audioCtx = window.AudioContext || window.webkitAudioContext;
  // Start audio context.
  player.audioContext = new audioCtx({ latencyHint: 0 })
  // This is necessary to make the audio context work on iOS.
  await player.audioContext.resume()

  calibrating.value = true

  let startingSecond = props.motion.pos.toFixed(0)
  beepIntervalId = setInterval(() => {
    if (props.motion.pos.toFixed(0) > startingSecond) {
      startingSecond = props.motion.pos.toFixed(0)
      player.playOneShot(player.audioContext.currentTime + 1 + Number(calibratedLatency.value))
    }
  }, 10)

}

// Handle button click and hold
const handleMousedown = (stepSize: number) => {
  userHoldingButton.value = true
  changecalibratedLatency(stepSize)
}
const changecalibratedLatency = (stepSize: number) => {
  // Round to two decimal places (to prevent funky computer maths)
  const newValue = Math.round(((calibratedLatency.value + stepSize) + Number.EPSILON) * 100) / 100
  if (newValue <= 0 && newValue >= -0.6) {
    if (userHoldingButton.value) {
      calibratedLatency.value = newValue
      window.setTimeout(() => changecalibratedLatency(stepSize), 100)
    }
  }
}
// await new Promise(r => setTimeout(r, 10));

const finishCalibration = () => {
  localStorage.setItem("outputLatency", calibratedLatency.value.toString());
  calibrating.value = false
  window.clearInterval(beepIntervalId)
  emit('calibrationFinished', calibratedLatency.value)
}

onMounted(() => {
  const outputLatencyFromCalibration = localStorage.getItem("outputLatency")
  if (outputLatencyFromCalibration) {
    calibratedLatency.value = Number(outputLatencyFromCalibration)
  }
})
</script>

<template>
  <div class="h-screen flex flex-col px-16 text-secondary mt-60">
    <div class="flex justify-center w-full gap-x-6 mb-10">
      <button v-if="calibrating"
              @mousedown="handleMousedown(-0.01)"
              @mouseup="userHoldingButton = false"
              data-test="btn--increase-calibratedLatency">
        <img :src="IconArrowLeft"
             width="25"
             height="25">
      </button>
      <span class="text-5xl">{{ calibratedLatency.toFixed(2) }}</span>
      <button v-if="calibrating"
              @mousedown="handleMousedown(0.01)"
              @mouseup="userHoldingButton
              = false"
              data-test="btn--decrease-calibratedLatency">
        <img :src="IconArrowRight"
             width="25"
             height="25">
      </button>
    </div>
    <div v-if="!calibrating"
         class="flex flex-col items-center">
      <button @click="startCalibration"
              data-test="btn--start-calibration">
        <img :src="IconStartCalibration"
             width="50"
             height="50">
      </button>
      <p class="text-tertiary text-lg text-center mt-10">Click the Play button above to start calibrating</p>
    </div>
    <div v-else
         class="flex flex-col items-center">
      <button @click="finishCalibration">
        <img :src="IconStopCalibration"
             width="50"
             height="50">
      </button>
      <p class="text-tertiary text-lg text-center mt-10">Calibrate to click sound using the arrow keys press stop when
        finished</p>
    </div>
  </div>
</template>
