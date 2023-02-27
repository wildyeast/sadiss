<script setup lang="ts">
defineProps(['track'])
defineEmits(['startTrack', 'deleteTrack', 'editTrack'])

const stopTrack = async () => {
  try {
    await fetch(`${process.env.VUE_APP_API_URL}/stop-track`)
  } catch (err) {
    alert('Error when stopping track: ' + err)
  }
}
</script>

<template>
  <div class="relative flex flex-col items-start overflow-hidden rounded border border-white px-4 py-2">
    <button
      @click="$emit('editTrack')"
      class="absolute top-0 right-6">
      ✎
    </button>
    <button
      @click="$emit('deleteTrack')"
      class="absolute top-0 right-1">
      ✖
    </button>
    <h4 class="font-bold">{{ track.name }}</h4>
    <p>Mode: {{ track.mode }}</p>
    <p>Waveform: {{ track.waveform }}</p>
    <p>TTS Rate: {{ track.ttsRate }}</p>
    <p class="text-start">{{ track.notes }}</p>
    <div class="m-0 mb-2 flex self-center">
      <Button @click="$emit('startTrack')">Start</Button>
      <Button @click="stopTrack">Stop</Button>
    </div>
  </div>
</template>
