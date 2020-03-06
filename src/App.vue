<template>
  <div>
    Primary frequency: <input
      v-model="modules.osc1.freq.value"
      type="range"
      :min="modules.osc1.freq.min"
      :max="modules.osc1.freq.max"
      :step="modules.osc1.freq.step"
      style="width: 400px"
    ><br>
    Modulation frequency: <input
      v-model="modules.osc1.mod.value"
      type="range"
      :min="modules.osc1.mod.min"
      :max="modules.osc1.mod.max"
      :step="modules.osc1.mod.step"
      style="width: 400px"
    ><br>
    Modulation amount: <input
      v-model="modules.osc1.amount.value"
      type="range"
      :min="modules.osc1.amount.min"
      :max="modules.osc1.amount.max"
      :step="modules.osc1.amount.step"
      style="width: 400px"
    ><br>
    Gain: <input
      v-model="modules.osc1.gain.value"
      type="range"
      :min="modules.osc1.gain.min"
      :max="modules.osc1.gain.max"
      :step="modules.osc1.gain.step"
      style="width: 400px"
    ><br>
    <Lfo
      v-for="lfo of lfos"
      :key="lfo.id"
      :lfo="lfo"
    />
    <button @click="addLfo">
      add lfo
    </button><br>
  </div>
</template>
<script>
/* global getOscillator */
import Lfo from './components/Lfo.vue'

export default {
  name: 'App',
  components: { Lfo },
  data: () => ({
    osc: null,
    modules: {
      osc1: {
        freq: {
          value: 0,
          offset: 0,
          init: 50,
          min: 55,
          max: 880,
          step: 1
        },
        mod: {
          value: 0,
          offset: 0,
          init: 0,
          min: 0,
          max: 3,
          step: 0.01
        },
        amount: {
          value: 0,
          offset: 0,
          init: 0,
          min: 0,
          max: 3,
          step: 0.01
        },
        gain: {
          value: 0,
          offset: 0,
          init: 0.8,
          min: 0,
          max: 1,
          step: 0.05
        }
      }
    },
    lfos: [],
  }),
  watch: {
    'modules.osc1.freq.value': function (to) {
      this.setOsc1Value('freq', Number(to))
    },
    'modules.osc1.mod.value': function (to) {
      this.setOsc1Value('mod', Number(to))
    },
    'modules.osc1.amount.value': function (to) {
      this.setOsc1Value('amount', Number(to))
    },
    'modules.osc1.gain.value': function (to) {
      this.setOsc1Value('gain', Number(to))
    }
  },
  async mounted () {
    // Wait until rust module loaded (see ../index.js)
    while (!window.getOscillator) {
      await this.sleep(100)
    }
    this.init()
  },
  methods: {
    // Call wasm oscillator function
    setOsc1Value (key, value) {
      const offset = Number(this.modules.osc1[key].offset)
      const finalValue = Number(value) + offset
      if (isNaN(finalValue)) {
        console.error('Invalid oscillator input! key:', key, 'value:', value, 'offset:', offset, 'final:', finalValue)
      }
      this.osc[`set_${key}`](finalValue)
    },
    addToOffset (key, value) {
      this.modules.osc1[key].offset += value
      this.setOsc1Value(key, this.modules.osc1[key].value)
    },
    async sleep (ms) {
      // TODO Move timing mechanism to Rust for more accuracy
      await new Promise(resolve => setTimeout(resolve, ms))
    },
    addLfo () {
      this.lfos.push({
        id: this.lfos.length,
        depth: 0,
        rate: 0,
        target: 'freq',
        run: this.runLfo
      })
    },
    async runLfo (lfo) {
      let direction = -1
      while (true) {
        const depth = (this.modules.osc1[lfo.target].max - this.modules.osc1[lfo.target].min) * lfo.depth
        this.addToOffset(lfo.target, (depth * direction)) // offset
        direction = direction * -1
        await this.sleep(lfo.rate)
      }
    },
    // Start oscillator
    init () {
      this.osc = getOscillator()
      for (const key of Object.keys(this.modules.osc1)) {
        this.modules.osc1[key].value = this.modules.osc1[key].init
      }
    }
  }
}
</script>
