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
      v-model="lfo.rate.value"
      type="range"
      min="0"
      max="1000"
      style="width: 400px"
    > {{ lfo.rate.value }}<br>
    LFO depth: <input
      v-model="lfo.depth.value"
      type="range"
      min="0"
      max="1"
      step="0.05"
      style="width: 400px"
    > {{ lfo.depth.value }}<br>
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
  computed: {
    targets () {
      const targets = []
      // Add oscillator targets
      for (const oscillator of modules.oscillators) {
        for (const key of Object.keys(oscillator)) {
          if (key === 'id') continue
          const target = oscillator[key]
          target.name = `osc${oscillator.id}${key}`
          target.key = key
          target.oscillator = oscillator
          targets.push(target)
        }
      }
      // Add LFO targets
      for (const lfo of modules.lfos) {
        if (lfo === this.lfo) continue
        for (const key of ['depth', 'rate']) {
          if (['id', 'run'].includes(key)) continue
          const target = lfo[key]
          target.name = `lfo${lfo.id}${key}`
          target.key = key
          targets.push(target)
        }
      }
      return targets
    }
  },
  mounted () {
    this.lfo.target = this.targets[0]
    this.$nextTick(() => {
      this.lfo.run(this.lfo)
    })
  }
}
</script>
