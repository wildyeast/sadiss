<template>
  <!-- oscillator[key].currentValue represents the oscillator parameter that is currently affecting thes sound -->
  <div>
    
    <SliderWithIndicator />

    Primary frequency: <input
      v-model="oscillator.freq.value"
      @input="$emit('change', 'freq')"
      type="range"
      :min="oscillator.freq.min"
      :max="oscillator.freq.max"
      :step="oscillator.freq.step"
      style="width: 400px"
    ><br>
    Modulation frequency: <input
      v-model="oscillator.mod.value"
      @input="$emit('change', 'mod')"
      type="range"
      :min="oscillator.mod.min"
      :max="oscillator.mod.max"
      :step="oscillator.mod.step"
      style="width: 400px"
    ><br>
    Modulation amount: <input
      v-model="oscillator.amount.value"
      @input="$emit('change', 'amount')"
      type="range"
      :min="oscillator.amount.min"
      :max="oscillator.amount.max"
      :step="oscillator.amount.step"
      style="width: 400px"
    ><br>
    Gain: <input
      v-model="oscillator.gain.value"
      @input="$emit('change', 'gain')"
      type="range"
      :min="oscillator.gain.min"
      :max="oscillator.gain.max"
      :step="oscillator.gain.step"
      style="width: 400px"
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
  }
}
</script>
