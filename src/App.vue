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
    // allBreakpoints: [],
    wasm: null
  }),
  async mounted () {
    // Wait until rust module loaded (see ../index.js)
    while (!window.getOscillator) {
      await this.sleep(100)
    }

    // this.wasm = await import('../pkg/index.js')

    // Fetch breakpoints from server
    const res = await fetch ('http://8hz.at/api/track/11')
    const json = await res.json()
    const partialData = JSON.parse(json.partials)
    const breakpoints = partialData[0].breakpoints

    this.audioContext = new(window.AudioContext || window.webkitAudioContext)()
    this.now = this.audioContext.currentTime;

    for (const partial of partialData) {
      const osc = this.setupOscillator(partial, partial.startTime)
      const oscObj = {
        osc,
        startTime: partial.startTime,
        endTime: partial.endTime
      }
      this.oscillators.push(oscObj)
    }



  },
  methods: {

    setupOscillator(partial, startTime) {
      const osc = this.audioContext.createOscillator()
      const gain = this.audioContext.createGain()

      console.log(partial)

      osc.frequency.value = 0
      gain.gain.value = 0

      let time = this.now + Number(startTime);
      console.log(time)

      for (let i = 0; i < partial.breakpoints.length; i++) {
        const currentBreakpoint = partial.breakpoints[i]
        // if (times[i] - times[i-1] < 0) continue

        if (i > 0) {
          time += (currentBreakpoint.time - partial.breakpoints[i-1].time)
        }

        osc.frequency.setValueAtTime(currentBreakpoint.freq, time);
        gain.gain.setValueAtTime(currentBreakpoint.amp, time);
      }

      return osc

    },

    async write (oscIndex, time, freq, gain) {
      this.oscillators[oscIndex].engine['set_gain'](gain)
      this.oscillators[oscIndex].engine['set_freq'](freq)
      await this.sleep(time)
    },
    /* Cheap js sleep function. Is not timing-accurate. We should try to
      implement a timer as a Rust function as early as possible */
    async sleep (ms) {
      await new Promise(resolve => setTimeout(resolve, ms))
    },
    /* Initialises oscillators. Should be 1 oscillator per partial */
    init () {
      // for (const oscillator of modules.oscillators) {
        const oscillator = {...modules.oscillators[0]}
        oscillator.engine = getOscillator()
        // this.osc = oscillator
        for (const key of Object.keys(oscillator)) {
          if (key === 'id') continue
          oscillator[key].value = oscillator[key].init
        }
        return oscillator
      // }
    },
    async play () {
      for (const oscObj of this.oscillators) {
        oscObj.osc.connect(this.audioContext.destination); 
        oscObj.osc.start(this.now + Number(oscObj.startTime));
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
