import { expect } from 'vitest'
import { mount, shallowMount } from '@vue/test-utils'
import { AudioContext } from 'standardized-audio-context-mock';
import OutputLatencyCalibration from '../../src/components/OutputLatencyCalibration.vue';

//@ts-ignore
global.AudioContext = AudioContext;

// @ts-ignore
test('mount component', async () => {
  expect(OutputLatencyCalibration).toBeTruthy()
})

// @ts-ignore
test('basic component user action flow', async () => {
  const wrapper = shallowMount(OutputLatencyCalibration)
  // const wrapper = shallowMount(OutputLatencyCalibration, {
  //   propsData: {
  //     motion: { pos: 0 }
  //   }
  // })
  // expect(wrapper.props().motion).toEqual({ pos: 0 })
  expect(wrapper.text()).toMatch('Start calibration')
  await wrapper.get('[data-test="btn--start-calibration"]').trigger('click')
  expect(wrapper.text()).toMatch('Finish calibration')
})

// @ts-ignore
test('increasing and decreasing outputLatency', async () => {
  const wrapper = shallowMount(OutputLatencyCalibration)
  expect(wrapper.text()).toMatch('Start calibration')
  await wrapper.get('[data-test="btn--start-calibration"]').trigger('click')

  expect(wrapper.text()).toMatch('0.00')
  await wrapper.get('[data-test="btn--increase-calibratedLatency"]').trigger('mousedown')
  expect(wrapper.text()).toMatch('-0.01')
  await wrapper.get('[data-test="btn--decrease-calibratedLatency"]').trigger('mousedown')
  expect(wrapper.text()).toMatch('0.00')
})
