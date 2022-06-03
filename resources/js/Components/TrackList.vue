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
  mode.value = 'perform'
  return axios.post(`/api/performance/add_tracks/${props.performance.id}`, null, {
    params: {
      tracks: performanceTracks.value.map(track => track.id)
    }
  })
}

</script>

<template>
  <div class="w-full px-4 border flex flex-col justify-center">
    <div class="flex justify-center gap-2 mt-2">
      <button @click="mode = 'perform'" class="border p-2" :class="mode === 'perform' ? 'bg-[#EEE]' : 'bg-transparent'">Perform</button>
      <button @click="mode = 'edit'" class="border p-2" :class="mode === 'edit' ? 'bg-[#EEE]' : 'bg-transparent'">Edit Tracklist</button>
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
              :class="selectedTrack === track ? 'bg-[#EEE]' : 'bg-transparent'"
              class="cursor-pointer">
          {{ track.title }}
        </div>
    </div>
    <button v-if="mode === 'edit'" @click="save" class="border p-2 mb-2">Save</button>
  </div>
</template>