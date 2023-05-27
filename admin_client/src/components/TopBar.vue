<script setup lang="ts"></script>
<template>
  <div class="flex h-[80px] w-full items-center border-b border-light px-2">
    <router-link to="/">
      <img
        src="https://sadiss.net/wp-content/uploads/2022/07/Sadiss-Logo.png"
        class="h-12" />
    </router-link>
    <nav v-if="false">
      <router-link to="/">Home</router-link> |
      <router-link to="/about">About</router-link>
    </nav>
  </div>
</template>
