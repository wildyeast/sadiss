<script setup lang="ts">
import { RouteLocationRaw } from "vue-router"
import PlusIcon from "../assets/plus.svg"

defineProps<{
  to: RouteLocationRaw
  text: string
}>()
</script>

<template>
  <RouterLink :to="to" class="button flex flex-col items-center my-6 gap-4">
    <PlusIcon />
    <span class="text-lg text-secondary">{{ text }}</span>
  </RouterLink>
</template>
