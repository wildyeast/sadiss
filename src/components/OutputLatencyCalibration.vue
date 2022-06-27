<script setup>
import Player from '../Player.js'
import { ref } from 'vue';

const emit = defineEmits(['calibrationFinished'])

const BEEP_FREQUENCY_MS = 1400;

let beepIntervalId;
let player;

let buffer = ref(0)

const calibrating = ref(false)

const startCalibration = () => {
  const dot = document.querySelector('.dot')

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
  player.audioContext.resume()
  calibrating.value = true
  beepIntervalId = window.setInterval(() => {
    const now = player.audioContext.currentTime
    const time = now + Number(buffer.value)
    player.playOneShot(time)
    console.log(buffer.value)
    dot.style['background'] = '#39FF14'
    window.setTimeout(() => {
      dot.style['background'] = 'black'
    }, 50)
  }, BEEP_FREQUENCY_MS)
}

const finishCalibration = () => {
  localStorage.setItem("outputLatency", buffer.value * -1);
  calibrating.value = false
  window.clearInterval(beepIntervalId)
  emit('calibrationFinished', { calibratedLatency: buffer.value * - 1 })
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
