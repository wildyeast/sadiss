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
    Modulation frequency: <SliderWithIndicator
      v-model="oscillator.mod.value"
      @input="$emit('change', 'mod')"
      :sliderValue="+oscillator.mod.value"
      :indicatorValue="+oscillator.mod.value + oscillator.mod.offset"
      :options="optionsModFreq"
    /><br>
    Modulation amount: <SliderWithIndicator
      v-model="oscillator.amount.value"
      @input="$emit('change', 'amount')"
      :sliderValue="+oscillator.amount.value"
      :indicatorValue="+oscillator.amount.value + oscillator.amount.offset"
      :options="optionsModAmount"
    /><br>
    Gain: <SliderWithIndicator
      v-model="oscillator.gain.value"
      @input="$emit('change', 'gain')"
      :sliderValue="+oscillator.gain.value"
      :indicatorValue="+oscillator.gain.value + oscillator.gain.offset"
      :options="optionsGain"
    /><br>
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
