<template>
  <div>
    LFO waveform: <select><option>square</option></select><br>
    LFO target: <select v-model="lfo.target">
      <option
        v-for="target of targets"
        :value="target"
      >
        {{ target.name }}
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
import { modules } from '../constants'
export default {
  name: 'Lfo',
  props: {
    lfo: {
      type: Object,
      required: true
    }
  },
  mounted () {
    this.lfo.target = this.targets[0]
    this.$nextTick(() => {
      this.lfo.run(this.lfo)
    })
  },
  computed: {
    targets () {
      const targets = []
      for (const oscillator of modules.oscillators) {
        for (const key of Object.keys(oscillator)) {
          if (key === 'id') continue
          const target = { ...oscillator[key] }
          target.name = `osc${oscillator.id}${key}`
          target.key = key
          target.oscillator = oscillator
          targets.push(target)
        }
      }
      return targets
    }
  }
}
</script>
