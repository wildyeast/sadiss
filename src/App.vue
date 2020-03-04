<template>
  <div>
    Primary frequency: <input type="range" :min="faderValues.freq.min" :max="faderValues.freq.max" :step="faderValues.freq.step" style="width: 400px" v-model="freq" /><br>
    Modulation frequency: <input type="range" :min="faderValues.mod.min" :max="faderValues.mod.max" :step="faderValues.mod.step" style="width: 400px" v-model="mod" /><br>
    Modulation amount: <input type="range" :min="faderValues.amount.min" :max="faderValues.amount.max" :step="faderValues.amount.step" style="width: 400px" v-model="amount" /><br>
    Gain: <input type="range" step="0.05" :min="faderValues.gain.min" :max="faderValues.gain.max" :step="faderValues.gain.step" style="width: 400px" v-model="gain" /><br>
    LFO waveform: <select><option>square</option></select><br>
    LFO target: <select v-model="lfo.target"><option v-for="key of Object.keys(operationsDict)" :value="key">{{ key }}</option></select><br>
    LFO rate: <input type="range" min="0" max="1000" style="width: 400px" v-model="lfo.rate" /> {{ lfo.rate }}<br>
    LFO depth: <input type="range" min="0" max="1" step="0.05"  style="width: 400px" v-model="lfo.depth" /> {{ lfo.depth }}<br>
    <button @click="startLfo">Start Lfo</button><br>
  </div>
</template>
<script>
/* global getOscillator */


export default {
  name: 'App',
  data: () => ({
    osc: null,
    freq: 0,
    freqOffset: 0,
    mod: 0,
    modOffset: 0,
    amount: 0,
    amountOffset: 0,
    gain: 0,
    gainOffset: 0,
    lfo: {
      depth: 0,
      rate: 0,
      target: 'freq'
    },
    operationsDict: {
      freq: 'set_primary_frequency',
      mod: 'set_fm_frequency',
      amount: 'set_fm_amount',
      gain: 'set_gain'
    },
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
      this.callOsc('set_primary_frequency', Number(to), this.freqOffset)
    },
    mod: function (to) {
      this.callOsc('set_fm_frequency', Number(to), this.modOffset)
    },
    amount: function (to) {
      this.callOsc('set_fm_amount', Number(to), this.amountOffset)
    },
    gain: function (to) {
      this.callOsc('set_gain', Number(to), this.gainOffset)
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
    callOsc (f, newValue, offset) {
      this.osc[f](Number(newValue) + Number(offset))
    },
    async sleep (ms) {
      // TODO Move timing mechanism to Wasm for more accuracy
      await new Promise(resolve => setTimeout(resolve, ms))
    },
    async startLfo () {
      let direction = -1
      while(true) {
        let depth = (this.faderValues[this.lfo.target].max - this.faderValues[this.lfo.target].min) * this.lfo.depth
        this.callOsc(
          this.operationsDict[this.lfo.target], // property
          this[this.lfo.target],// newValue
          this[`${this.lfo.target}Offset`] + (depth * direction)) // offset
        direction *= -1
        await this.sleep(this.lfo.rate)
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
