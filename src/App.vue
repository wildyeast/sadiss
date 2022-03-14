<template>
  <div class="app">
    <button @click="player.play">Play</button>
    <button @click="register">Register</button>
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
    player: null,
    token: null
  }),
  async mounted () {
    // Fetch breakpoints from server
    const res = await fetch ('http://8hz.at/api/track/3')
    const json = await res.json()
    const partialData = JSON.parse(json.partials)
    // Initialize player
    this.player = new Player(partialData)
  },
  methods: {
    async register () {
      const response = await fetch('http://sadiss.test.test/api/client/create', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({performance_id: 1})
      })
      const data = await response.json()
      this.token = data.token

      const intervalId = window.setInterval(async () => {
        const clientData = await this.checkForStart();
        if (clientData['start_time']) {
          window.clearInterval(intervalId)
          console.log(clientData['start_time'])
        } else {
          console.log(clientData)
        }
      }, 1000);
      
    },
    async checkForStart () {
      const response = await fetch(`http://sadiss.test.test/api/client/${this.token}`)
      const data = await response.json()
      return data
    }

  }
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
