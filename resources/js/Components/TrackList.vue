<script setup>
import InfoBox from "./InfoBox.vue"
import InfoTuple from "./InfoTuple.vue"
import TracksPopup from "./TracksPopup.vue"
import axios from 'axios';
import { onMounted, ref, computed } from 'vue';

const props = defineProps(['performance', 'playingTrack'])

const emits = defineEmits(['trackSelected'])

const performanceTracks = ref([])

const tracks = ref([])
const mode = ref('perform')
const selectedTrack = ref()
const isTracksPopupVisible = ref(false)
const loading = ref(true)

const tracksNotInPerformance = computed(() => {
  const x =  tracks.value.filter(t => !performanceTracks.value.find(pt => pt.id === t.id))
  console.log('t', x)
  return x
})

onMounted(async () => {
  const trackResponse = await axios.get(`${process.env.MIX_API_SLUG}/tracklist`)
  tracks.value = trackResponse.data

  const performanceTrackResponse = await axios.get(`${process.env.MIX_API_SLUG}/performance/get_tracks/${props.performance.id}`)
  performanceTracks.value = performanceTrackResponse.data

  loading.value = false

})

const trackSelected = async (track) => {
  emits('trackSelected', track)
  const res = await axios.get(`${process.env.MIX_API_SLUG}/track/${track.id}/duration`)
  track.duration = res.data
  selectedTrack.value = track
}

const remove = track => {
  performanceTracks.value.splice(performanceTracks.value.indexOf(track), 1)
  save()
}

const moveUp = track => {
  const i = performanceTracks.value.indexOf(track)
  performanceTracks.value[i] = performanceTracks.value[i - 1]
  performanceTracks.value[i - 1] = track
  save()
}

const moveDown = track => {
  const i = performanceTracks.value.indexOf(track)
  performanceTracks.value[i] = performanceTracks.value[i + 1]
  performanceTracks.value[i + 1] = track
  save()
}

const addTrackToPerformance = track => {
  if (track['tts_languages']) {
    for (const lang of track['tts_languages']) {
      if (!props.performance['tts_languages'].includes(lang)) {
        alert("TTS languages of track and performance don't match.")
        return
      }
    }
  }
  performanceTracks.value.push(track)
  save()
}

const save = () => {
  mode.value = 'perform'
  return axios.post(`${process.env.MIX_API_SLUG}/performance/add_tracks/${props.performance.id}`, null, {
    params: {
      tracks: performanceTracks.value.map(track => track.id)
    }
  })
}

</script>

<template>
  <TracksPopup v-if="isTracksPopupVisible"
    :tracks="tracksNotInPerformance"
    @addTrack="addTrackToPerformance" 
    @close="isTracksPopupVisible = false" />
  <InfoBox title="playlist" class="mt-1 relative">
    <button @click="isTracksPopupVisible = true" class="text-lg px-2 absolute text-white top-0 right-0">+</button>
    <div v-if="loading"
        class="flex justify-center">
      <div class="lds-dual-ring" />
    </div>
    <div v-for="track of performanceTracks" :key="track.id"
      :class="['px-1', 'flex', 'flex-row',
      'justify-between', 'border-b-1',
      playingTrack && playingTrack.id === track.id &&
        selectedTrack && selectedTrack.id === track.id ? 'bg-gradient-to-l from-secondary to-tertiary text-white' :
          selectedTrack && selectedTrack.id === track.id ? 'bg-secondary text-white' :
            playingTrack && playingTrack.id === track.id ? 'bg-tertiary text-white' : 'odd:bg-grey']">
      <div class="cursor-pointer" @click="trackSelected(track)">
        #{{ performanceTracks.indexOf(track) }} {{ track.title }}
        <span v-if="track.tts_instructions"> | TTS</span>
        <span v-if="track.is_choir"> | Choir</span>
      </div>
      <div>
        <button v-if="performanceTracks.indexOf(track) !== 0" @click="moveUp(track)" class="ml-2">⬆️</button>
        <button v-if="performanceTracks.indexOf(track) !== performanceTracks.length - 1" @click="moveDown(track)" class="ml-2">⬇️</button>
        <button v-else class="w-6" />
        <button @click="remove(track)" class="ml-2">🗑</button>
      </div>
    </div>
  </InfoBox>
</template>
