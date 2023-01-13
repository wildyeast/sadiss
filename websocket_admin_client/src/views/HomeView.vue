<script setup lang="ts">
  import { ref, onMounted, inject } from 'vue'

  const isUploadModalVisible = ref(false)
  const axios: any = inject('axios')

  const trackName = ref('')
  const trackNotes = ref('')
  let file

  const handleFileUpload = async (e) => {
    file = e.target.files[0]
  }

  const upload = () => {
    if (!trackName.value) {
      alert('You must enter a track title.')
    }
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
<template>
  <div class="flex flex-col">
    <Button @click="isUploadModalVisible = true">Upload new track</Button>
    <Modal title="Upload track" v-if="isUploadModalVisible">
      <div class="flex flex-row my-8 justify-between p-2">
        <div>Title</div>
        <input v-model="trackName" class="w-3/4">
      </div>
      <div class="flex flex-row my-8 justify-between p-2">
        <div>Partials file</div>
        <input type="file" @change="handleFileUpload($event)"
           accept="*.txt" class="w-3/4">
      </div>
      <div class="flex flex-row my-8 justify-between p-2">
        <div>Subtitle files</div>
        <input type="file" @change="handleFileUpload($event)"
           accept="*.txt" class="w-3/4">
      </div>
      <div class="flex flex-row my-8 justify-between p-2">
        <div>Private notes</div>
        <textarea v-model="trackNotes" class="w-3/4" />
      </div>
      <div class="flex flex-row w-full justify-center">
        <Button @click="upload">Upload</Button>
      </div>
    </Modal>
  </div>
</template>
