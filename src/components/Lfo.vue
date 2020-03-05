<template>
  <div>
    LFO waveform: <select><option>square</option></select><br>
    LFO target: <select v-model="lfo.target"><option v-for="operation of operations" :value="operation">{{ operation }}</option></select><br>
    LFO rate: <input type="range" min="0" max="1000" style="width: 400px" v-model="lfo.rate" /> {{ lfo.rate }}<br>
    LFO depth: <input type="range" min="0" max="1" step="0.05"  style="width: 400px" v-model="lfo.depth" /> {{ lfo.depth }}<br>
  </div>
</template>
<script>
import { operations } from '../constants'
export default {
  name: 'Lfo',
  data: () => ({
    operations
  }),
  props: {
    lfo: {
      type: Object,
      required: true
    }
  },
  mounted () {
    this.lfo.run(this.lfo)
  }
}
</script>
