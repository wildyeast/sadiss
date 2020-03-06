<template>
  <div>
    <Oscillator
      v-for="oscillator of modules.oscillators"
      :key="`oscillator${oscillator.id}`"
      :oscillator="oscillator"
      @change="callOscillator(oscillator, $event)"
    />
    <Lfo
      v-for="lfo of modules.lfos"
      :key="`lfo${lfo.id}`"
      :lfo="lfo"
    />
    <button @click="addLfo">add lfo</button>
  </div>
</template>
<script>
/* global getOscillator */
import { modules } from './constants'
import Oscillator from './components/Oscillator.vue'
import Lfo from './components/Lfo.vue'

export default {
  name: 'App',
  components: { Oscillator, Lfo },
  data: () => ({
    osc: null,
    modules
  }),
  async mounted () {
    // Wait until rust module loaded (see ../index.js)
    while (!window.getOscillator) {
      await this.sleep(100)
    }
    this.init()
  },
  methods: {
    // Call wasm oscillator function
    callOscillator (oscillator, key) {
      // console.log(oscillator, key)
      const value = Number(oscillator[key].value)
      const offset = Number(oscillator[key].offset)
      const finalValue = Number(value) + offset
      if (isNaN(finalValue)) {
        console.error('Invalid oscillator input! key:', key, 'value:', value, 'offset:', offset, 'final:', finalValue)
      }
      this.osc[`set_${key}`](finalValue)
      oscillator[key].currentValue = finalValue
    },
    addToOffset (key, value) {
    //  this.modules.oscillators[0][key].offset += value
      // this.setOsc1Value(key)
    },
    async sleep (ms) {
      // TODO Move timing mechanism to Rust for more accuracy
      await new Promise(resolve => setTimeout(resolve, ms))
    },
    addLfo () {
      modules.lfos.push({
        id: modules.lfos.length,
        depth: 0,
        rate: 0,
        run: this.runLfo
      })
    },
    async runLfo (lfo) {
      console.log('run', lfo)
      let direction = -1
      while (true) {
        const depth = (lfo.target.max - lfo.target.min) * lfo.depth
        this.addToOffset(lfo.target, (depth * direction)) // offset
        lfo.target.offset += depth * direction
        this.callOscillator(lfo.target.oscillator, lfo.target.key)
        direction = direction * -1
        await this.sleep(lfo.rate)
      }
    },
    init () {
      // Run oscillator
      this.osc = getOscillator()
      // Initialize oscillator
      for (const oscillator of modules.oscillators) {
        for (const key of Object.keys(oscillator)) {
          if (key === 'id') continue
          oscillator[key].value = oscillator[key].init
        }
      }
    }
  }
}
</script>
