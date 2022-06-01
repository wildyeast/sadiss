<script setup>
import axios from 'axios';
import { onMounted, ref } from 'vue';

const props = defineProps(['performance'])

const emits = defineEmits(['trackSelected'])

const performanceTracks = ref([])
const tracks = ref()
const mode = ref('perform')
const selectedTrack = ref()

onMounted(async () => {
    const trackResponse = await axios.get(`/api/track`)
    tracks.value = trackResponse.data

    const performanceTrackResponse = await axios.get(`/api/performance/get_tracks/${props.performance.id}`)
    performanceTracks.value = performanceTrackResponse.data
})

const trackSelected = (track) => {
  emits('trackSelected', track)
  selectedTrack.value = track
}

const save = () => {
  return axios.post(`/api/performance/add_tracks/${props.performance.id}`, null, {
    params: {
      tracks: performanceTracks.value.map(track => track.id)
    }
  })
}

</script>

<template>
  <div class="w-screen px-4 bg-[#EFEFEF] flex flex-col justify-center">
    <div class="flex justify-center gap-2">
      <button @click="mode = 'perform'">Perform</button>
      <button @click="mode = 'edit'">Edit Tracklist</button>
    </div>
    <div v-if="mode === 'edit'" class="flex w-full">
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
    <div v-if="mode === 'perform'">
        <div  v-for="track of performanceTracks"
              @click="trackSelected(track)"
              :class="selectedTrack === track ? 'bg-white' : 'bg-transparent'"
              class="cursor-pointer">
          {{ track.title }}
        </div>
    </div>
    <button v-if="mode === 'edit'" @click="save">Save</button>
  </div>
</template>