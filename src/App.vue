<template>
  <div>
    <button @click="play">Play / Pause</button><br>
    Primary frequency: <input type="range" min="30" max="80" value="50" style="width: 400px" v-model="note" /><br>
    Modulation frequency: <input type="range" min="0" max="3" value="0" step="0.01"  style="width: 400px" v-model="fmFreq" /><br>
    Modulation amount: <input type="range" min="0" max="3" value="0" step="0.01"  style="width: 400px" v-model="amount" />
  </div>
</template>
<script>
/* global getOscillator */
export default {
  name: 'App',
  data: () => ({
    osc: null,
    note: 50,
    fmFreq: 0,
    amount: 0,
    gain: 0.8
  }),
  watch: {
    note: function (to) {
      this.osc.set_note(Number(to))
    },
    fmFreq: function (to) {
      this.osc.set_fm_frequency(Number(to))
    },
    amount: function (to) {
      this.osc.set_fm_amount(Number(to))
    },
    gain: function (to) {
      this.osc.set_gain(Number(to))
    }
  },
  methods: {
    play () {
      if (this.osc === null) {
        this.osc = getOscillator()
        this.osc.set_note(this.note)
        this.osc.set_fm_frequency(this.fmFreq)
        this.osc.set_fm_amount(this.amount)
        this.osc.set_gain(this.gain)
      } else {
        this.osc.free()
        this.osc = null
      }
    }
  }
}
</script>
