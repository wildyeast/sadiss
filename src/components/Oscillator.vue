<template>
  <!-- oscillator[key].currentValue represents the oscillator parameter that is currently affecting thes sound -->
  <div>
    
    Primary frequency: <SliderWithIndicator
      v-model="oscillator.freq.value"
      @input="$emit('change', 'freq')"
      :sliderValue="+oscillator.freq.value"
      :indicatorValue="+oscillator.freq.value + oscillator.freq.offset"
      :options="optionsPrimFreq"
    /><br>
    Modulation frequency: <input
      v-model="oscillator.mod.value"
      type="range"
      :min="oscillator.mod.min"
      :max="oscillator.mod.max"
      :step="oscillator.mod.step"
      style="width: 400px"
      @input="$emit('change', 'mod')"
    ><br>
    Modulation amount: <input
      v-model="oscillator.amount.value"
      type="range"
      :min="oscillator.amount.min"
      :max="oscillator.amount.max"
      :step="oscillator.amount.step"
      style="width: 400px"
      @input="$emit('change', 'amount')"
    ><br>
    Gain: <input
      v-model="oscillator.gain.value"
      type="range"
      :min="oscillator.gain.min"
      :max="oscillator.gain.max"
      :step="oscillator.gain.step"
      style="width: 400px"
      @input="$emit('change', 'gain')"
    >
  </div>
</template>
<script>
import Vue from 'vue'
import SliderWithIndicator from 'vue-slider-with-indicator'

export default {
  name: 'Oscillator',
  components: { SliderWithIndicator },
  props: {
    oscillator: {
      type: Object,
      required: true
    }
  },
  computed: {
    optionsPrimFreq () {
      return {
        min: this.oscillator.freq.min,
        max: this.oscillator.freq.max,
        step: this.oscillator.freq.step
      }
    }
  }
}
</script>
