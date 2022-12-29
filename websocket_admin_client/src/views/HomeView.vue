<template>
  <div class="home">
    <label for="pfile">Upload a partials file:</label>
    <input type="file" @change="handleFileUpload($event)"
       id="pfile" name="pfile"
       accept="*.txt">
    <button @click="play">Play</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, inject } from 'vue'

const axios: any = inject('axios')

let file

const handleFileUpload = async (e) => {
  file = e.target.files[0]
}

const play = () => {
  console.log('play', file)
  const data = new FormData()
  data.append('filename', file)
  axios.post('http://localhost:3000/init', data)
  .then(response => {
        console.log(response.data)
    })
    .catch(error => {
        console.log(error)
    });
}

</script>
