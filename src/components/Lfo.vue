<template>
  <div>
    LFO waveform: <select v-model="lfo.shape">
      <option
        v-for="shape of shapes"
        :value="shape"
      >
        {{ shape }}
      </option>
    </select><br>
    LFO target: <select
      v-model="lfo.target"
      @input="changeTarget"
    >
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
      @input="lfo.rate.currentValue = lfo.rate.value"
    /><br>
    LFO depth: <SliderWithIndicator
      v-model="lfo.depth.value"
      :slider-value="+lfo.depth.value"
      :indicator-value="+lfo.depth.currentValue"
      :options="optionsLfoDepth"
      @input="lfo.depth.currentValue = lfo.depth.value"
    /><br>
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
  data: () => ({
    targets: [],
    shapes: ['triangle', 'square', 'sawUp', 'sawDown', 'random']
  }),
  computed: {
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
    this.targets = this.getTargets()
    this.lfo.shape = 'triangle'
    this.lfo.target = this.targets[0]
    this.lfo.run(this.lfo)
  },
  methods: {
    getTargets () {
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
        for (const key of ['rate', 'depth']) {
          if (['id', 'run'].includes(key)) continue
          const target = lfo[key]
          target.name = `lfo${lfo.id}${key}`
          target.key = key
          targets.push(target)
        }
      }
      return targets
    },
    // Reset value of previous target
    changeTarget () {
      this.lfo.target.currentValue = this.lfo.target.value
    }

  }
}
</script>
