<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>
<template>
  <div class="fixed left-0 right-0 bg-primary px-2 py-4 lg:px-10">
    <h1 class="text-center text-3xl font-bold">{{ title }}</h1>
    <slot />
  </div>
</template>
