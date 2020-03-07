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
    LFO rate: <SliderWithIndicator
      v-model="lfo.rate.value"
      :slider-value="+lfo.rate.value"
      :indicator-value="+lfo.rate.currentValue"
      :options="optionsLfoRate"
    /><br>
    LFO depth: <SliderWithIndicator
      v-model="lfo.depth.value"
      :slider-value="+lfo.depth.value"
      :indicator-value="+lfo.depth.currentValue"
      :options="optionsLfoDepth"
    /><br>
    {{ lfo.depth }}
  </div>
</template>
<script>
import SliderWithIndicator from 'vue-slider-with-indicator'
import { modules } from '../constants'

export default {
  name: 'Lfo',
  components: { SliderWithIndicator },
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
    },
    optionsLfoRate () {
      return {
        min: 0,
        max: 1000
      }
    },
    optionsLfoDepth () {
      return {
        min: 0,
        max: 1,
        step: 0.05
      }
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
