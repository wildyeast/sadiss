<script setup>
import Player from '../Player.js'
import { ref } from 'vue';

const emit = defineEmits(['calibrationFinished'])
const props = defineProps(['motion'])

let beepIntervalId;
let player;

let offset = ref(0.00)

const calibrating = ref(false)

const startCalibration = () => {
  const outputLatencyFromCalibration = localStorage.getItem("outputLatency");
  if (outputLatencyFromCalibration) {
    offset.value = Number(outputLatencyFromCalibration)
  }

  player = null
    // Initialize player
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
      player.playOneShot(player.audioContext.currentTime + 1 + Number(offset.value) * -1)
    }
  }, 10)

}

const holding = ref(false)
const handleMousedown = (stepSize) => {
  holding.value = true
  changeOffset(stepSize)
}
const changeOffset = (stepSize) => {
  // Round to two decimal places (two prevent funky computed maths)
  const newValue = Math.round(((offset.value + stepSize) + Number.EPSILON) * 100) / 100
  if (newValue <= 0 && newValue >= -0.6) {
    if (holding.value) {
      offset.value = newValue
      window.setTimeout(() => changeOffset(stepSize), 100)
    }
  }
}
// await new Promise(r => setTimeout(r, 10));

const finishCalibration = () => {
  localStorage.setItem("outputLatency", offset.value);
  calibrating.value = false
  window.clearInterval(beepIntervalId)
  emit('calibrationFinished', { calibratedLatency: offset.value })
}
</script>

<template>
<div class="h-screen flex flex-col justify-center items-center">
  <button v-if="!calibrating" @click="startCalibration">Start calibration</button>
  <div v-else class="flex flex-col justify-center items-center">
    <span class="text-5xl mb-4">{{ offset.toFixed(2) }}</span>
    <div class="flex justify-between w-full">
      <button class="border h-10 w-10" @mousedown="handleMousedown(-0.01)" @mouseup="holding = false">&lt;</button>
      <button class="border h-10 w-10" @mousedown="handleMousedown(0.01)" @mouseup="holding = false">&gt;</button>
    </div>
    <button class="mt-4 border p-4" @click="finishCalibration">Finish calibration</button>
  </div>
</div>
</template>
