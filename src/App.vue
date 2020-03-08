<template>
  <div class="app">
    <div class="oscillators">
      <Oscillator
        v-for="oscillator of modules.oscillators"
        :key="`oscillator${oscillator.id}`"
        :oscillator="oscillator"
        :linking="linking"
        @change="callOscillator(oscillator, $event)"
        @addLfo="addLfo"
      />
    </div>
    <button class="addLfo" @click="toggleLinking">
      🐸
    </button>
    <div class="lfos">
      <Lfo
        v-for="lfo of modules.lfos"
        :key="`lfo${lfo.id}`"
        :lfo="lfo"
        :linking="linking"
        @addLfo="addLfo"
      />
    </div>
  </div>
</template>
<script>
/* global getOscillator */
import { modules } from './constants'
import Oscillator from './components/Oscillator.vue'
import Lfo from './components/Lfo.vue'

export default {
  name: 'App',
  components: { Oscillator, Lfo },
  data: () => ({
    modules,
    linking: false
  }),
  async mounted () {
    // Wait until rust module loaded (see ../index.js)
    while (!window.getOscillator) {
      await this.sleep(100)
    }
    this.init()
  },
  methods: {
    // Call wasm oscillator function
    callOscillator (oscillator, key) {
      const value = Number(oscillator[key].value)
      const offset = Number(oscillator[key].offset)
      const finalValue = value + offset
      if (isNaN(finalValue)) {
        console.error('Invalid oscillator input! key:', key, 'value:', value, 'offset:', offset, 'final:', finalValue)
      }
      oscillator.engine[`set_${key}`](finalValue)
      oscillator[key].currentValue = finalValue
    },
    async sleep (ms) {
      // TODO Move timing mechanism to Rust for more accuracy
      await new Promise(resolve => setTimeout(resolve, ms))
    },
    addLfo (targetContainer) {
      if (!this.linking) return

      let target
      if (targetContainer.oscillator) {  // Target is oscillator
        target = targetContainer.oscillator[targetContainer.key]
        target.oscillator = targetContainer.oscillator 
        target.key = targetContainer.key
      } else { // Target is LFO
        target = targetContainer
      }

      this.linking = false
      modules.lfos.push({
        id: modules.lfos.length,
        rate: {
          value: 0,
          offset: 0,
          min: 0,
          max: 1000,
          step: 1,
          currentValue: 0
        },
        depth: {
          value: 0,
          offset: 0,
          min: 0,
          max: 1,
          step: 0.1,
          currentValue: 0
        },
        shape: 'sine',
        target,
        run: this.runLfo
      })
    },
    toggleLinking () {
      this.linking = !this.linking
    },
    async runLfo (lfo) {
      // FEATURE Add phase
      let position = -1
      let direction = 1
      let sineHelperValue = 0
      while (true) {
        const depth = (lfo.target.max - lfo.target.min) * lfo.depth.currentValue
        lfo.target.offset = depth * position
        if (lfo.target.oscillator) { // target is oscillator
          this.callOscillator(lfo.target.oscillator, lfo.target.key)
        } else { // target is lfo
          const value = Number(lfo.target.value)
          const offset = Number(lfo.target.offset)
          let finalValue = value + offset
          if (finalValue < lfo.target.min) finalValue = lfo.target.min
          if (finalValue > lfo.target.max) finalValue = lfo.target.max
          lfo.target.currentValue = finalValue
        }
        switch (lfo.shape) {
          case 'sine':
            position = Math.sin(sineHelperValue)
            sineHelperValue += Math.PI / 100
            break
          case 'square':
            position = position * -1
            break
          case 'sawUp':
            position += 0.01
            if (position >= 1) position = -1
            break
          case 'sawDown':
            if (position <= -1) position = 1
            position -= 0.01
            break
          case 'triangle':
            if (direction < 0) {
              position -= 0.01
            } else {
              position += 0.01
            }
            if (position > 1 || position < -1) {
              direction *= -1
            }
            break
          case 'random':
            position = Math.random() * 2 - 1
            break
          default:
            console.error('Bad LFO shape:', lfo.shape)
        }
        await this.sleep(lfo.rate.currentValue)
      }
    },
    init () {
      for (const oscillator of modules.oscillators) {
        oscillator.engine = getOscillator()
        for (const key of Object.keys(oscillator)) {
          if (key === 'id') continue
          oscillator[key].value = oscillator[key].init
        }
      }
    }
  }
}
</script>
<style>
.app {
  --primaryColor: darkgreen;
  --secondaryColor: rgba(200, 200, 0, 0.8);
  --tertiaryColor: lightblue;
  color: var(--primaryColor);
}
.oscillators, .lfos {
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
}
.label {
  margin-top: 0.5em;
}
.addLfo {
  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
  width: 100%;
  font-size: 7em;
  cursor: pointer;
  background: none;
  border: none;
}
</style>
