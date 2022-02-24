<template>
  <div class="app">
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
    linking: false,
    osc: null
  }),
  async mounted () {
    // Wait until rust module loaded (see ../index.js)
    while (!window.getOscillator) {
      await this.sleep(100)
    }
    // Initialises oscillator
    this.init()
    // Just an example breakpoint loaded from ./constants
    for (const bp of bps) {
      await this.write(1, bp.freq, bp.amp)
    }
    // TODO Call the server api to fetch breakpoints instead.
  },
  methods: {
    /* To give instructions to oscillator, use

         oscillator.engine[command](value) 

         Possible commands are:
           'set_gain' to set amplitude 
           'set_freq' to set frequency 
         There are more (see ./lib.rs) but we will not need the others

         Currently, oscillators are initialized with zero gain. 
     */
    async write (time, freq, gain) {
      this.osc.engine['set_gain'](gain)
      this.osc.engine['set_freq'](freq)
      await this.sleep(10)
    },
    /* Cheap js sleep function. Is not timing-accurate. We should try to
      implement a timer as a Rust function as early as possible */
    async sleep (ms) {
      await new Promise(resolve => setTimeout(resolve, ms))
    },
    /* Initialises oscillators. Should be 1 oscillator per partial */
    init () {
      for (const oscillator of modules.oscillators) {
        oscillator.engine = getOscillator()
        this.osc = oscillator
        for (const key of Object.keys(oscillator)) {
          if (key === 'id') continue
          oscillator[key].value = oscillator[key].init
        }
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
