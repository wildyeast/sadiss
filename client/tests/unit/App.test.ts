import { expect } from 'vitest'
import App from '../../src/App.vue'
import { AudioContext } from 'standardized-audio-context-mock';

//@ts-ignore
global.AudioContext = AudioContext;

// @ts-ignore
test('mount component', async () => {
  expect(App).toBeTruthy()
})