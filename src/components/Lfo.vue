<template>
  <div class="lfo" style="borderColor: 'darkred';">
    <div class="label">WELLE</div> <select v-model="lfo.shape">
      <option
        v-for="shape of shapes"
        :value="shape"
      >
        {{ shape }}
      </option>
    </select>
    <div class="label">GESCHWINDIGKEIT</div> <SliderWithIndicator
      v-model="lfo.rate.value"
      :slider-value="+lfo.rate.value"
      :indicator-value="+lfo.rate.currentValue"
      :options="optionsLfoRate"
      @click.native="$emit('addLfo', lfo.rate)"
      @input="lfo.rate.currentValue = lfo.rate.value"
    />
    <div class="label">TIEFE</div> <SliderWithIndicator
      v-model="lfo.depth.value"
      :slider-value="+lfo.depth.value"
      :indicator-value="+lfo.depth.currentValue"
      :options="optionsLfoDepth"
      @click.native="$emit('addLfo', lfo.depth)"
      @input="lfo.depth.currentValue = lfo.depth.value"
    />
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
    },
    linking: {
      type: Boolean,
      required: true
    }
  },
  data: () => ({
    targets: [],
    shapes: ['sine', 'triangle', 'square', 'sawUp', 'sawDown', 'random']
  }),
  computed: {
    optionsLfoRate () {
      return {
        min: 0,
        max: 1000,
        style: {
          sliderHeight: '20px',
          backgroundColor: this.linking ? 'darkblue' : 'darkgreen',
          indicatorColor: 'darkred'
        }
      }
    },
    optionsLfoDepth () {
      return {
        min: 0,
        max: 1,
        step: 0.05,
        style: {
          sliderHeight: '20px',
          backgroundColor: this.linking ? 'darkblue' : 'darkgreen',
          indicatorColor: 'darkred'
        }
      }
    }
  },
  mounted () {
    // this.targets = this.getTargets()
    this.lfo.shape = 'sine'
    // this.lfo.target = this.targets[0]
    this.lfo.run(this.lfo)
  },
  methods: {
    getTargets () {
      if (window) return
      const targets = []
      // Add oscillator targets
      for (const oscillator of modules.oscillators) {
        for (const key of ['freq', 'mod', 'amount', 'gain']) {
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
<style scoped>
.lfo {
  position: relative;
  border: 1px dashed darkred;
  padding: 0.5em;
  margin: 0.5em;
}
</style>
