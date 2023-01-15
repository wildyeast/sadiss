<script setup lang="ts">
defineProps(['track'])
defineEmits(['startTrack', 'deleteTrack'])
</script>

<template>
  <div>
    <h4 class="font-bold">{{ track.name }}</h4>
    <div @click="$emit('deleteTrack')"
         class="cursor-pointer">✖</div>
  </div>
  <p>{{ track.notes }}</p>
  <Button @click="$emit('startTrack')">Start</Button>
</template>
