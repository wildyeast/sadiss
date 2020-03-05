<template>
  <div>
    Primary frequency: <input
      v-model="freq"
      type="range"
      :min="faderValues.freq.min"
      :max="faderValues.freq.max"
      :step="faderValues.freq.step"
      style="width: 400px"
    ><br>
    Modulation frequency: <input
      v-model="mod"
      type="range"
      :min="faderValues.mod.min"
      :max="faderValues.mod.max"
      :step="faderValues.mod.step"
      style="width: 400px"
    ><br>
    Modulation amount: <input
      v-model="amount"
      type="range"
      :min="faderValues.amount.min"
      :max="faderValues.amount.max"
      :step="faderValues.amount.step"
      style="width: 400px"
    ><br>
    Gain: <input
      v-model="gain"
      type="range"
      :min="faderValues.gain.min"
      :max="faderValues.gain.max"
      :step="faderValues.gain.step"
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
import { operations } from './constants'

export default {
  name: 'App',
  components: { Lfo },
  data: () => ({
    osc: null,
    operations,
    freq: 0,
    freqOffset: 0,
    mod: 0,
    modOffset: 0,
    amount: 0,
    amountOffset: 0,
    gain: 0,
    gainOffset: 0,
    lfos: [],
    faderValues: {
      freq: {
        init: 50,
        min: 55,
        max: 880,
        step: 1
      },
      mod: {
        init: 0,
        min: 0,
        max: 3,
        step: 0.01
      },
      amount: {
        init: 0,
        min: 0,
        max: 3,
        step: 0.01
      },
      gain: {
        init: 0.8,
        min: 0,
        max: 1,
        step: 0.05
      }
    }
  }),
  watch: {
    freq: function (to) {
      this.setOscValue('freq', Number(to))
    },
    mod: function (to) {
      this.setOscValue('mod', Number(to))
    },
    amount: function (to) {
      this.setOscValue('amount', Number(to))
    },
    gain: function (to) {
      this.setOscValue('gain', Number(to))
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
    setOscValue (key, value) {
      this.osc[`set_${key}`](Number(value) + Number(this[`${key}Offset`]))
    },
    addToOffset (key, value) {
      this[`${key}Offset`] += value
      this.setOscValue(key, this[key])
    },
    async sleep (ms) {
      // TODO Move timing mechanism to Wasm for more accuracy
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
        const depth = (this.faderValues[lfo.target].max - this.faderValues[lfo.target].min) * lfo.depth
        this.addToOffset(lfo.target, (depth * direction)) // offset
        direction = direction * -1
        await this.sleep(lfo.rate)
      }
    },
    // Start oscillator
    init () {
      this.osc = getOscillator()
      for (const key of Object.keys(this.faderValues)) {
        this[key] = this.faderValues[key].init
      }
    }
  }
}
</script>
