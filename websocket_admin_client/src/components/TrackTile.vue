<script setup lang="ts">
const props = defineProps(['track'])

const startTrack = async () => {
  const res = await fetch('http://localhost:3005/start-track/' + props.track._id, {
    method: 'POST'
  })
}

const deleteTrack = async () => {
  if (confirm('Do you want to delete track: ' + props.track.name + '? This cannot be reversed.')) {
    const res = await fetch('http://localhost:3005/delete-track/' + props.track._id, {
      method: 'POST'
    })
  }
}

</script>

<template>
  <div>
    <h4 class="font-bold">{{ track.name }}</h4>
    <div @click="deleteTrack"
         class="cursor-pointer">✖</div>
  </div>
  <p>{{ track.notes }}</p>
  <Button @click="startTrack">Start</Button>
</template>
