<template>
  <span class="material-icons mi-play-arrow cursor-pointer" @click="player.play" />
</template>

<script>
import Player from '@/Player'
import { onUpdated } from 'vue'
export default {
  props: {
    partialData: String,
  },
  setup (props) {
    let player = null

    const parsedPartialData = JSON.parse(props.partialData)

    player = new Player(parsedPartialData)

    return {
      player
    }

  }
}
</script>