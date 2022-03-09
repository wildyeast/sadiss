<template>
  <span v-if="player.playing" class="material-icons mi-pause cursor-pointer" @click="player.stop" />
  <span v-else class="material-icons mi-play-arrow cursor-pointer" @click="player.play" />
</template>

<script>
import Player from '@/Player'
import { reactive } from 'vue'
export default {
  props: {
    partialData: String,
  },
  setup (props) {
    const parsedPartialData = JSON.parse(props.partialData)
    const player = reactive(new Player(parsedPartialData))

    return {
      player
    }

  }
}
</script>