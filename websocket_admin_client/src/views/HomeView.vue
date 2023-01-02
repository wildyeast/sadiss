<template>
  <div class="flex flex-col">
    <div class="flex flex-col my-8">
      <div>Track name</div>
      <input v-model="trackName">
    </div>
    <div class="flex flex-col my-8">
      <div>Partials file</div>
      <input type="file" @change="handleFileUpload($event)"
         accept="*.txt">
    </div>
    <div class="flex flex-col my-8">
      <div>Track notes</div>
      <textarea v-model="trackNotes" />
    </div>
    <button @click="upload">Upload</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, inject } from 'vue'

const axios: any = inject('axios')

const trackName = ref('')
const trackNotes = ref('')
let file

const handleFileUpload = async (e) => {
  file = e.target.files[0]
}

const upload = () => {
  const data = new FormData()
  data.append('pfile', file)
  data.append('name', trackName.value)
  data.append('notes', trackNotes.value)
  axios.post('http://localhost:3000/upload', data)
  .then(response => {
        console.log(response.data)
    })
    .catch(error => {
        console.log(error)
    });
}

</script>
