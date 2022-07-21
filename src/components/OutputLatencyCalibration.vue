<script setup lang="ts">
import Player from '../Player'
import { ref } from 'vue';

const emit = defineEmits(['calibrationFinished'])
const props = defineProps(['motion'])

let beepIntervalId: NodeJS.Timer;
let player: Player;

const calibrating = ref(false)
const calibratedLatency = ref(0.00)
const userHoldingButton = ref(false)

const startCalibration = () => {
  const outputLatencyFromCalibration = localStorage.getItem("outputLatency");
  if (outputLatencyFromCalibration) {
    calibratedLatency.value = Number(outputLatencyFromCalibration)
  }

  player = new Player();

  const audioCtx = window.AudioContext || window.webkitAudioContext;
  // Start audio context.
  player.audioContext = new audioCtx({ latencyHint: 0 })
  // This is necessary to make the audio context work on iOS.
  player.audioContext.resume()

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
</script>

<template>
  <div class="h-screen flex flex-col justify-center items-center">
    <button v-if="!calibrating" @click="startCalibration" data-test="btn--start-calibration">Start calibration</button>
    <div v-else class="flex flex-col justify-center items-center">
      <span class="text-5xl mb-4">{{ calibratedLatency.toFixed(2) }}</span>
      <div class="flex justify-between w-full">
        <button class="border h-10 w-10" @mousedown="handleMousedown(-0.01)" @mouseup="userHoldingButton = false"
          data-test="btn--increase-calibratedLatency">&lt;</button>
        <button class="border h-10 w-10" @mousedown="handleMousedown(0.01)" @mouseup="userHoldingButton
        = false" data-test="btn--decrease-calibratedLatency">&gt;</button>
      </div>
      <button class="mt-4 border p-4" @click="finishCalibration">Finish calibration</button>
    </div>
  </div>
</template>
