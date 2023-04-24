<script setup lang="ts"></script>
<template>
  <div class="flex min-h-full w-full flex-col items-center justify-between overflow-scroll bg-primary p-4 px-6">
    <div class="flex flex-col items-center">
      <img
        src="../../public/assets/sadiss-logo.png"
        class="my-8 w-1/2" />
    </div>
    <slot />
  </div>
</template>
