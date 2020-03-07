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
    <button @click="addLfo">
      add lfo
    </button>
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
      const value = Number(oscillator[key].value)
      const offset = Number(oscillator[key].offset)
      const finalValue = Number(value) + offset
      if (isNaN(finalValue)) {
        console.error('Invalid oscillator input! key:', key, 'value:', value, 'offset:', offset, 'final:', finalValue)
      }
      this.osc[`set_${key}`](finalValue)
      oscillator[key].currentValue = finalValue
    },
    async sleep (ms) {
      // TODO Move timing mechanism to Rust for more accuracy
      await new Promise(resolve => setTimeout(resolve, ms))
    },
    addLfo () {
      modules.lfos.push({
        id: modules.lfos.length,
        rate: {
          value: 0,
          offset: 0,
          min: 0,
          max: 1000,
          step: 1
        },
        depth: {
          value: 0,
          offset: 0,
          min: 0,
          max: 1,
          step: 0.1
        },
        run: this.runLfo
      })
    },
    async runLfo (lfo) {
      let direction = -1
      while (true) {
        const depth = (lfo.target.max - lfo.target.min) * lfo.depth.value
        lfo.target.offset = depth * direction
        if (lfo.target.oscillator) { // target is oscillator
          this.callOscillator(lfo.target.oscillator, lfo.target.key)
        } else { // target is lfo
          let value = Number(lfo.target.value) + Number(lfo.target.offset)
          if (value < lfo.target.min) value = lfo.target.min
          if (value > lfo.target.max) value = lfo.target.max
          lfo.target.value = value
        }
        direction = direction * -1
        await this.sleep(lfo.rate.value)
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
