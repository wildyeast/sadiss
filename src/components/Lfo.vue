<template>
  <div>
    LFO waveform: <select><option>square</option></select><br>
    LFO target: <select v-model="lfo.target">
      <option
        v-for="operation of operations"
        :key="operation"
        :value="operation"
      >
        {{ operation }}
      </option>
    </select><br>
    LFO rate: <input
      v-model="lfo.rate"
      type="range"
      min="0"
      max="1000"
      style="width: 400px"
    > {{ lfo.rate }}<br>
    LFO depth: <input
      v-model="lfo.depth"
      type="range"
      min="0"
      max="1"
      step="0.05"
      style="width: 400px"
    > {{ lfo.depth }}<br>
  </div>
</template>
<script>
import { operations } from '../constants'
export default {
  name: 'Lfo',
  props: {
    lfo: {
      type: Object,
      required: true
    }
  },
  data: () => ({
    operations
  }),
  mounted () {
    this.lfo.run(this.lfo)
  },
  computed: {
    targets () {
      
    }
  }
}
</script>
