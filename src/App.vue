<template>
  <div class="app">
    <button @click="play">Play</button>
  </div>
</template>
<script>
/* global getOscillator */
import { modules, bps } from './constants'

export default {
  name: 'App',
  components: { },
  data: () => ({
    modules,
    audioContext: null,
    now: null,
    linking: false,
    osc: null,
    oscillators: [],
    partialData: null,
    wasm: null
  }),
  async mounted () {
    // Fetch breakpoints from server
    const res = await fetch ('http://8hz.at/api/track/3')
    const json = await res.json()
    this.partialData = JSON.parse(json.partials)
  },
  methods: {
    setupOscillator(partial, startTime) {
      const osc = this.audioContext.createOscillator()
      const gain = this.audioContext.createGain()

      console.log(partial)

      osc.frequency.value = 0
      gain.gain.value = 0

      let time = this.now + Number(startTime);

      for (let i = 0; i < partial.breakpoints.length; i++) {
        const currentBreakpoint = partial.breakpoints[i]
        // if (times[i] - times[i-1] < 0) continue
        if (i > 0) {
          time += (currentBreakpoint.time - partial.breakpoints[i-1].time)
        }
        osc.frequency.setValueAtTime(currentBreakpoint.freq, time);
        gain.gain.setValueAtTime(currentBreakpoint.amp, time);
      }

      return {osc, gain}

    },
    async play () {
    // https://www.html5rocks.com/en/tutorials/audio/scheduling/
    this.audioContext = new(window.AudioContext || window.webkitAudioContext)()
    this.now = this.audioContext.currentTime;

    for (const partial of this.partialData) {
      const osc = this.setupOscillator(partial, partial.startTime)
      const oscObj = {
        osc: osc.osc,
        gain: osc.gain,
        startTime: partial.startTime,
        endTime: partial.endTime
      }
      this.oscillators.push(oscObj)
    }
      for (const oscObj of this.oscillators) {
        // Connect osc and gain to destination
        oscObj.gain.connect(this.audioContext.destination)
        oscObj.osc.connect(this.audioContext.destination)
        // Connect gain to osc 
        oscObj.osc.connect(oscObj.gain);

        oscObj.osc.start(this.now)
        oscObj.osc.stop(this.now + Number(oscObj.endTime))
      }
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
