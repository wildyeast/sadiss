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
    this.lfo.shape = 'sine'
    this.lfo.run(this.lfo)
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
