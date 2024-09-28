<script setup lang="ts">
import { storeTrack } from "../api"
import { useRouter } from "vue-router"
import TrackForm from "../components/TrackForm.vue"
import { StoreTrack } from "../types"

const router = useRouter()

const handleStoreTrack = async (formData: StoreTrack) => {
  try {
    await storeTrack(formData)
    await router.push("/tracks")
  } catch (error) {
    console.error(error)
  }
}
</script>
<template>
  <TrackForm @storeTrack="handleStoreTrack" />
</template>
