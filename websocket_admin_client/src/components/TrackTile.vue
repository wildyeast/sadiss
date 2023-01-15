<script setup lang="ts">
defineProps(['track'])
defineEmits(['startTrack', 'deleteTrack'])
</script>

<template>
  <div class="border border-white rounded px-4 py-2 relative flex flex-col items-start">
    <div @click="$emit('deleteTrack')"
         class="cursor-pointer absolute top-0 right-1">✖</div>
    <h4 class="font-bold">{{ track.name }}</h4>
    <p>Mode: {{ track.mode }}</p>
    <p class="text-start">{{ track.notes }}</p>
    <Button @click="$emit('startTrack')"
            class="m-0 mb-2 self-center">Start</Button>
  </div>
</template>
