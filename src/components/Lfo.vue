<template>
  <div
    class="lfo"
    :style="{ borderColor: lfo.color }"
  >
    <div class="label">
      Welle
    </div> <select v-model="lfo.shape">
      <option
        v-for="shape of shapes"
        :key="shape"
        :value="shape"
      >
        {{ shape }}
      </option>
    </select>
    <div class="label">
      Geschwindigkeit
    </div> <SliderWithIndicator
      v-model="lfo.rate.value"
      :slider-value="+lfo.rate.value"
      :indicator-value="+lfo.rate.currentValue"
      :options="optionsLfoRate"
      @click.native="$emit('addLfo', lfo.rate)"
      @input="lfo.rate.currentValue = lfo.rate.value"
    />
    <div class="label">
      Tiefe
    </div> <SliderWithIndicator
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
          backgroundColor: this.linking ? 'white' : this.lfo.color,
          indicatorColor: this.lfo.rate.color
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
          backgroundColor: this.linking ? 'white' : this.lfo.color,
          indicatorColor: this.lfo.depth.color
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
