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
  axios.post(`${API_URL}/upload`, data)
    .then((response: AxiosResponse) => {
      console.log(response.data)
    })
    .catch((error: Error) => {
      console.log(error)
    })
}

const tracks = ref<{ _id: string, name: string, notes: string }[]>([])
onMounted(async () => {
  const data = await fetch(`${API_URL}/get-tracks`)
    .then(res => res.json())
  tracks.value = JSON.parse(data).tracks
})

</script>
<template>
  <div class="flex flex-col">
    <Button @click="isUploadModalVisible = true">Upload new track</Button>

    <div v-if="tracks.length">
      <TrackTile v-for="track of tracks"
                 :key="track._id"
                 :track="track" />
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
