<script setup lang="ts">
const props = defineProps(['title'])
</script>
<template>
  <div class="fixed top-0 left-0 flex h-screen w-screen items-center justify-center overflow-scroll bg-modal">
    <div class="w-1/2 rounded bg-white text-primary shadow">
      <div class="w-100 flex h-8 flex-row items-center justify-between border-b border-primary p-2 font-bold">
        <div>{{ title }}</div>
        <button
          @click="$emit('close')"
          class="cursor-pointer">
          ✖
        </button>
      </div>
      <div>
        <slot />
      </div>
    </div>
  </div>
</template>
