<script setup lang="ts"></script>
<template>
  <div class="flex h-full w-full flex-col justify-between overflow-scroll bg-primary">
    <div class="flex flex-col items-center">
      <img
        src="/assets/sadiss-logo.png"
        class="mt-6 mb-2 w-[40%]" />
    </div>
    <main class="flex flex-grow flex-col items-center justify-between px-8">
      <slot />
    </main>
    <img src="/assets/footer-dots.svg" />
  </div>
</template>
