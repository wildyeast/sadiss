<script setup>
import InfoBox from "./InfoBox.vue"
const props = defineProps(['tracks'])
const emits = defineEmits(['addTrack', 'close'])
</script>
<template>
  <div class="fixed top-0 left-0 w-screen h-screen flex justify-center items-center"
       style="background: rgba(0,0,0,0.5); z-index: 10"
       @click="emits('close')">
    <InfoBox @click.stop=""
             title="add tracks"
             class="w-2/5 h-2/3 bg-white border-1 relative overflow-y-scroll">
      <button @click="emits('close')"
              class="text-lg px-2 absolute text-white top-0 right-0">x</button>
      <div @click="emits('addTrack', track)"
           v-for="track of tracks"
           class="px-1 cursor-pointer">
        <div>
          {{ track.title }}
          <span v-if="track.tts_instructions"> | TTS</span>
          <span v-if="track.is_choir"> | Choir</span>
        </div>
      </div>
      <div v-if="!tracks.length"
           class="p-1 text-sm">
        All tracks have been added to this performance's playlist.
      </div>
    </InfoBox>
  </div>
</template>
