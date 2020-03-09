<template>
  <div class="oscillator">
    <div class="label">
      Hauptfrequenz
    </div> <SliderWithIndicator
      v-model="oscillator.freq.value"
      :slider-value="+oscillator.freq.value"
      :indicator-value="+oscillator.freq.value + oscillator.freq.offset"
      :options="optionsPrimFreq"
      @click.native.prevent="$emit('addLfo', { oscillator, key: 'freq' })"
      @input="$emit('change', 'freq')"
    />
    <div class="label">
      Modulationsfrequenz
    </div> <SliderWithIndicator
      v-model="oscillator.mod.value"
      :slider-value="+oscillator.mod.value"
      :indicator-value="+oscillator.mod.value + oscillator.mod.offset"
      :options="optionsModFreq"
      @click.native="$emit('addLfo', { oscillator, key: 'mod' })"
      @input="$emit('change', 'mod')"
    />
    <div class="label">
      Modulationskraft
    </div> <SliderWithIndicator
      v-model="oscillator.amount.value"
      :slider-value="+oscillator.amount.value"
      :indicator-value="+oscillator.amount.value + oscillator.amount.offset"
      :options="optionsModAmount"
      @click.native="$emit('addLfo', { oscillator, key: 'amount' })"
      @input="$emit('change', 'amount')"
    />
    <div class="label">
      Lautstärke
    </div> <SliderWithIndicator
      v-model="oscillator.gain.value"
      :slider-value="+oscillator.gain.value"
      :indicator-value="+oscillator.gain.value + oscillator.gain.offset"
      :options="optionsGain"
      @click.native="$emit('addLfo', { oscillator, key: 'gain' })"
      @input="$emit('change', 'gain')"
    />
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
    },
    linking: {
      type: Boolean,
      required: true
    }
  },
  computed: {
    optionsPrimFreq () {
      return {
        min: this.oscillator.freq.min,
        max: this.oscillator.freq.max,
        step: this.oscillator.freq.step,
        sliderHeight: '20px',
        backgroundColor: this.linking ? 'darkred' : 'darkgreen',
        indicatorColor: this.oscillator.freq.color
      }
    },
    optionsModFreq () {
      return {
        min: this.oscillator.mod.min,
        max: this.oscillator.mod.max,
        step: this.oscillator.mod.step,
        sliderHeight: '20px',
        backgroundColor: this.linking ? 'darkred' : 'darkgreen',
        indicatorColor: this.oscillator.mod.color
      }
    },
    optionsModAmount () {
      return {
        min: this.oscillator.amount.min,
        max: this.oscillator.amount.max,
        step: this.oscillator.amount.step,
        sliderHeight: '20px',
        backgroundColor: this.linking ? 'darkred' : 'darkgreen',
        indicatorColor: this.oscillator.amount.color
      }
    },
    optionsGain () {
      return {
        min: this.oscillator.gain.min,
        max: this.oscillator.gain.max,
        step: this.oscillator.gain.step,
        sliderHeight: '20px',
        backgroundColor: this.linking ? 'darkred' : 'darkgreen',
        indicatorColor: this.oscillator.gain.color
      }
    }
  }
}
</script>
<style scoped>
.oscillator {
  border: 2px groove var(--secondaryColor);
  background-color: #022;
  margin: 1em;
  padding: 0.5em;
}
</style>
