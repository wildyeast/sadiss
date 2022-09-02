import { expect } from 'vitest'
import Player from '../../src/Player'
import { AudioContext } from 'standardized-audio-context-mock';

//@ts-ignore
global.AudioContext = AudioContext;

let player: Player
// @ts-ignore FIXME: (All lines with test() ignored because of error)
test('Instantiate class', async () => {
  player = new Player()
  expect(player).toBeTruthy()
})

// @ts-ignore
test('AudioContext is initialized correctly', async () => {
  expect(player.audioContext).toBeTruthy()
})

// @ts-ignore
test('Create oscObj', async () => {
  const oscObj = player.createOscillatorAndGainNodes({
    startTime: 0,
    endTime: 0,
    breakpoints: [{
      time: 0,
      freq: 0,
      amp: 0
    }]
  }, 0)
  expect(oscObj).toBeTruthy()
})

// test('navigate to form', async () => {
//   const wrapper = mount(App)
//   expect(wrapper.vm.currentStep).toBe(-1)
//   await wrapper.get('[data-test="btn--go-to-registration-form"]').trigger('click')
//   expect(wrapper.vm.currentStep).toBe(0)
//   expect(wrapper.text()).toMatch('Persönliche Daten')
// })

// FIXME: This doesn't work, as setData doesn't work with variables in a setup function
// Interesting discussion here: https://github.com/vuejs/test-utils/issues/539
// test('submit personal data: empty form', async () => {
//   const wrapper = mount(App)
//   await wrapper.setData({ currentStep: 0 })
//   expect(wrapper.text()).toMatch('Persönliche Daten')

//   await wrapper.get('[data-test="btn--continue"]').trigger('click')
//   expect(wrapper.text()).toMatch('Bitte füllen Sie alle Pflichtfelder aus.')

// })