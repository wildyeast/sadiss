<template>
  <div class="app">
    <button @click="player.play">Play</button>
  </div>
</template>
<script>
/* global getOscillator */
import { modules, bps } from './constants'
import { Player } from './Player'

export default {
  name: 'App',
  components: { },
  data: () => ({
    modules,
    player: null
  }),
  async mounted () {
    // Fetch breakpoints from server
    const res = await fetch ('http://8hz.at/api/track/3')
    const json = await res.json()
    const partialData = JSON.parse(json.partials)
    // Initialize player
    this.player = new Player(partialData)
  },
  methods: {}
}
</script>
<style>
.app {
  --primaryColor: #11bd39;
  --secondaryColor: maroon;
  --tertiaryColor: lightblue;
  color: var(--primaryColor);
  font-family: 'UnifrakturCook', cursive;
  font-size: 1.1em;
  display: flex;
  flex-flow: column;
  align-items: center;
  overflow: hidden;
}
</style>
