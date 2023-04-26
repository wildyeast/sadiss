<script setup lang="ts"></script>
<template>
  <div class="flex h-full w-full flex-col justify-between overflow-scroll bg-primary">
    <div class="flex flex-col items-center">
      <img
        src="../../public/assets/sadiss-logo.png"
        class="my-6 w-1/2" />
    </div>
    <main class="flex flex-grow flex-col items-center justify-between p-4 px-6">
      <slot />
    </main>
    <img src="../../public/assets/footer-dots.svg" />
  </div>
</template>
