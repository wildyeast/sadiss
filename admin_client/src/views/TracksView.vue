<script setup lang="ts">
import { ref } from "vue"
import ActionButtonLink from "../components/ActionButtonLink.vue"
import TrackList from "../components/TrackList.vue"

const loading = ref(true)
</script>

<template>
  <h1>{{ $t("track", 2) }}</h1>
  <div v-if="loading" class="w-full flex justify-center">
    {{ $t("loading") }}
  </div>
  <TrackList @hasLoadedTracks="() => (loading = false)" :can-delete="true" />
  <ActionButtonLink v-if="!loading" to="/tracks/new" :text="$t('add_track')" />
</template>
