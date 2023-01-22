<script setup lang="ts">
const props = defineProps(['title'])
</script>
<template>
  <div class="absolute top-0 left-0 w-screen h-screen flex justify-center items-center bg-modal">
    <div class="w-1/2 bg-white text-primary rounded shadow">
      <div class="w-100 h-8 border-b border-primary flex flex-row justify-between items-center p-2 font-bold">
        <div>{{ title }}</div>
        <div @click="$emit('close')"
             class="cursor-pointer">✖</div>
      </div>
      <div>
        <slot />
      </div>
    </div>
  </div>
</template>
