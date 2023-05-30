<script setup lang="ts">
import FixedViewHeader from '@/components/FixedViewHeader.vue'
</script>
<template>
  <main>
    <FixedViewHeader title="Dashboard" />
    <div class="mt-12 flex items-center gap-4 px-2 pt-16 lg:flex-col">
      <router-link
        to="/performances"
        class="w-1/2 border p-6 text-center text-lg"
        >Performances
      </router-link>
      <router-link
        to="/tracks"
        class="w-1/2 border p-6 text-center text-lg"
        >Tracks
      </router-link>
    </div>
  </main>
</template>
