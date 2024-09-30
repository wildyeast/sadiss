<script setup lang="ts">
import { RouteLocationRaw } from "vue-router"
import IconCross from "../assets/cross.svg"

defineProps<{
  to: RouteLocationRaw
  text: string
}>()
</script>

<template>
  <div class="relative md:mx-5">
    <h1>{{ text }}</h1>
    <RouterLink
      :to="to"
      class="absolute top-[1px] right-0 pl-2 py-1 px-4 md:px-0">
      <IconCross class="h-[20px]" />
    </RouterLink>
  </div>
</template>
