<script setup lang="ts"></script>
<template>
  <div class="flex h-[80px] items-center border-b border-light px-2">
    <img
      src="https://sadiss.net/wp-content/uploads/2022/07/Sadiss-Logo.png"
      class="h-12" />
    <nav v-if="false">
      <router-link to="/">Home</router-link> |
      <router-link to="/about">About</router-link>
    </nav>
  </div>
</template>
