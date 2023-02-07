<script setup lang="ts">
defineProps(['track'])
defineEmits(['startTrack', 'deleteTrack', 'editTrack'])
</script>

<template>
  <div class="border border-white rounded px-4 py-2 relative flex flex-col items-start">
    <button @click="$emit('editTrack')"
            class="absolute top-0 right-6">✎</button>
    <button @click="$emit('deleteTrack')"
            class="absolute top-0 right-1">✖</button>
    <h4 class="font-bold">{{ track.name }}</h4>
    <p>Mode: {{ track.mode }}</p>
    <p>Waveform: {{ track.waveform }}</p>
    <p>TTS Rate: {{ track.ttsRate }}</p>
    <p class="text-start">{{ track.notes }}</p>
    <Button @click="$emit('startTrack')"
            class="m-0 mb-2 self-center">Start</Button>
  </div>
</template>
