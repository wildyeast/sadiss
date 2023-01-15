<script setup lang="ts">
import { AxiosResponse } from 'axios';
import { ref, onMounted, inject } from 'vue'
import TrackTile from '@/components/TrackTile.vue';

const isUploadModalVisible = ref(false)
const axios: any = inject('axios')

//const API_URL = 'http://localhost:3000'
const API_URL = 'https://sadiss.net/wss'

const trackName = ref('')
const trackNotes = ref('')
const trackIsChoir = ref(false)
let file: File

const handleFileUpload = async (e: Event) => {
  // TODO: Refactor this so we don't use non-null assertion
  file = (<HTMLInputElement>e.target).files![0]
}

const upload = () => {
  if (!trackName.value) {
    alert('You must enter a track title.')
  }
  const data = new FormData()
  data.append('pfile', file)
  data.append('name', trackName.value)
  data.append('notes', trackNotes.value)
  data.append('mode', trackIsChoir.value ? 'choir' : 'nonChoir')
  axios.post(`${API_URL}/upload`, data)
    .then((response: AxiosResponse) => {
      console.log(response.data)
    })
    .catch((error: Error) => {
      console.log(error)
    })
}

const startTrack = async (id: string) => {
  const res = await fetch(`http://localhost:3005/start-track/${id}/${globalTime.value + 2}`, {
    method: 'POST'
  })
}

const deleteTrack = async (id: string, name: string) => {
  if (confirm('Do you want to delete track: ' + name + '? This cannot be reversed.')) {
    const res = await fetch('http://localhost:3005/delete-track/' + id, {
      method: 'POST'
    })
  }
}

let motion: any
const globalTime = ref(-1)
const initializeMCorp = async () => {
  // @ts-ignore: Can't find name MCorp, which is added via <script> in index.html
  const mCorpApp = MCorp.app(process.env.VUE_APP_MCORP_API_KEY, { anon: true })
  mCorpApp.run = () => {
    motion = mCorpApp.motions['shared']
    startClock()
  }
  mCorpApp.init()
}

const startClock = () => {
  setInterval(() => {
    globalTime.value = motion.pos
  }, 10)
}

const tracks = ref<{ _id: string, name: string, notes: string }[]>([])
onMounted(async () => {
  await initializeMCorp()
  const data = await fetch(`${API_URL}/get-tracks`)
    .then(res => res.json())
  tracks.value = JSON.parse(data).tracks
})

</script>
<template>
  <div class="flex flex-col">
    <p>{{ globalTime.toFixed(0) }}</p>
    <Button @click="isUploadModalVisible = true">Upload new track</Button>

    <div v-if="tracks.length">
      <TrackTile v-for="track of tracks"
                 :key="track._id"
                 :track="track"
                 @delete-track="deleteTrack(track._id, track.name)"
                 @start-track="startTrack(track._id)" />
    </div>

    <Modal title="Upload track"
           v-if="isUploadModalVisible">
      <div class="flex flex-row my-8 justify-between p-2">
        <div>Title</div>
        <input v-model="trackName"
               class="w-3/4">
      </div>
      <div class="flex flex-row my-8 justify-between p-2">
        <div>Partials file</div>
        <input type="file"
               @change="handleFileUpload($event)"
               accept="*.txt"
               class="w-3/4">
      </div>
      <div class="flex flex-row my-8 justify-between p-2">
        <div>Subtitle files</div>
        <input type="file"
               @change="handleFileUpload($event)"
               accept="*.txt"
               class="w-3/4">
      </div>
      <div class="flex flex-row my-8 justify-between p-2">
        <div>Choir</div>
        <input type="checkbox"
               v-model="trackIsChoir"
               class="w-3/4">
      </div>
      <div class="flex flex-row my-8 justify-between p-2">
        <div>Private notes</div>
        <textarea v-model="trackNotes"
                  class="w-3/4" />
      </div>
      <div class="flex flex-row w-full justify-center">
        <Button @click="upload">Upload</Button>
      </div>
    </Modal>
  </div>
</template>
