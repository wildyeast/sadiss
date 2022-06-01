<script setup>
import axios from 'axios';
import { onMounted, ref } from 'vue';

const props = defineProps(['performance'])

const performanceTracks = ref([])
const tracks = ref()

onMounted(async () => {
    const response = await axios.get(`/api/track`)
    tracks.value = response.data
})

console.log(props.performance)

const save = () => {
  return axios.post(`/api/performance/add_tracks/${props.performance.id}`, null, {
    params: {
      tracks: performanceTracks.value.map(track => track.id)
    }
  })
}

</script>

<template>
  <div class="w-screen px-4 bg-[#DDD] flex flex-col justify-center">
    <div class="flex w-full">
      <div class="w-1/2 min-h-10 cursor-pointer">
        <div v-for="track of performanceTracks" @click="performanceTracks.splice(performanceTracks.indexOf(track), 1)">
          {{ track.title }}
        </div>
      </div>
      <div class="w-1/2 cursor-pointer">
        <div v-for="track of tracks" @click="performanceTracks.push(track)">
          {{ track.title }}
        </div>
      </div>
    </div>
    <button @click="save">Save</button>
  </div>
</template>