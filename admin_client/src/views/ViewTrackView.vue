<script setup lang="ts">
import TrackForm from "../components/TrackForm.vue"

const { trackId } = defineProps<{ trackId: string }>()
</script>
<template>
  <TrackForm :isViewMode="true" :trackId="trackId" />
</template>
