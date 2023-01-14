<script setup lang="ts">
defineProps(['track'])
</script>

<template>
  <h4 class="font-bold">{{ track.name }}</h4>
  <p>{{ track.notes }}</p>
</template>
