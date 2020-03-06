<template>
  <!-- oscillator[key].currentValue represents the oscillator parameter that is currently affecting thes sound -->
  <div>
    Primary frequency: <input
      v-model="oscillator.freq.value"
      type="range"
      :min="oscillator.freq.min"
      :max="oscillator.freq.max"
      :step="oscillator.freq.step"
      style="width: 400px"
      @input="$emit('change', 'freq')"
    ><br>
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
export default {
  name: 'Oscillator',
  props: {
    oscillator: {
      type: Object,
      required: true
    }
  }
}
</script>
