<script setup lang="ts">
import HeadlineWithCancelButton from "../components/HeadlineWithCancelButton.vue"
</script>

<template>
  <div class="w-full px-3">
    <HeadlineWithCancelButton
      :to="{ name: 'Performances' }"
      :text="$t('add_performance')" />
  </div>
</template>
