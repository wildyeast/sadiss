<script setup>
import Player from '../Player.js'
import { ref } from 'vue';

const emit = defineEmits(['calibrationFinished'])
const props = defineProps(['motion'])

let beepIntervalId;
let player;

let buffer = ref(0)

const calibrating = ref(false)

const startCalibration = () => {
  const outputLatencyFromCalibration = localStorage.getItem("outputLatency");
  if (outputLatencyFromCalibration) {
    buffer.value = outputLatencyFromCalibration * -1
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
      player.playOneShot(player.audioContext.currentTime + 1 + Number(buffer.value) * -1)
    }
  }, 10)

}

const finishCalibration = () => {
  localStorage.setItem("outputLatency", buffer.value * -1);
  calibrating.value = false
  window.clearInterval(beepIntervalId)
  emit('calibrationFinished', { calibratedLatency: buffer.value * -1 })
}
</script>

<template>
<div class="h-screen flex flex-col justify-center items-center">
  <div class="dot h-10 w-10 bg-black rounded-full mb-40"></div>
  <button v-if="!calibrating" @click="startCalibration">Start calibration</button>
  <div v-else class="flex flex-col justify-center items-center">
    <input type="range" min="0" max="0.6" step="0.01" v-model="buffer">
    {{ buffer }}
    <button @click="finishCalibration">Finish calibration</button>
  </div>
</div>
</template>
