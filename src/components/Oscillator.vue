<template>
  <!-- oscillator[key].currentValue represents the oscillator parameter that is currently affecting thes sound -->
  <div>
    Primary frequency: <SliderWithIndicator
      v-model="oscillator.freq.value"
      :slider-value="+oscillator.freq.value"
      :indicator-value="+oscillator.freq.value + oscillator.freq.offset"
      :options="optionsPrimFreq"
      @input="$emit('change', 'freq')"
    /><br>
    Modulation frequency: <SliderWithIndicator
      v-model="oscillator.mod.value"
      :slider-value="+oscillator.mod.value"
      :indicator-value="+oscillator.mod.value + oscillator.mod.offset"
      :options="optionsModFreq"
      @input="$emit('change', 'mod')"
    /><br>
    Modulation amount: <SliderWithIndicator
      v-model="oscillator.amount.value"
      :slider-value="+oscillator.amount.value"
      :indicator-value="+oscillator.amount.value + oscillator.amount.offset"
      :options="optionsModAmount"
      @input="$emit('change', 'amount')"
    /><br>
    Gain: <SliderWithIndicator
      v-model="oscillator.gain.value"
      :slider-value="+oscillator.gain.value"
      :indicator-value="+oscillator.gain.value + oscillator.gain.offset"
      :options="optionsGain"
      @input="$emit('change', 'gain')"
    /><br>
  </div>
</template>
<script>
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
    },
    optionsModFreq () {
      return {
        min: this.oscillator.mod.min,
        max: this.oscillator.mod.max,
        step: this.oscillator.mod.step,
        style: {
          sliderHeight: '20px'
        }
      }
    },
    optionsModAmount () {
      return {
        min: this.oscillator.amount.min,
        max: this.oscillator.amount.max,
        step: this.oscillator.amount.step,
        style: {
          sliderHeight: '20px'
        }
      }
    },
    optionsGain () {
      return {
        min: this.oscillator.gain.min,
        max: this.oscillator.gain.max,
        step: this.oscillator.gain.step,
        style: {
          sliderHeight: '20px'
        }
      }
    }
  }
}
</script>
