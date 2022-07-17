import { SpearPartial } from "./types/SpearPartial"

export default class Player {

  audioContext: AudioContext
  partialData: SpearPartial[] | null = null
  playing = false
  offset = 0
  oscillators: { osc: OscillatorNode, gain: GainNode, startTime: number, endTime: number }[] = []
  register: Function | null
  valuesSetForFirstPartial = []
  waveform: OscillatorType = 'sine'

  constructor (register: Function | null = null) {
    this.register = register

    // Start audio context.
    const audioCtx = window.AudioContext || window.webkitAudioContext;
    this.audioContext = new audioCtx({
      latencyHint: 0,
      // sampleRate: 31000,
    })
    // This is necessary to make the audio context work on iOS.
    this.audioContext.resume()
  }

  setup (partialData: SpearPartial[], startInSec: number, now: number) {
    this.partialData = partialData
    const timeToAddToStart = startInSec + now

    // Initialize oscillators, set all values for each oscillator
    for (const partial of partialData) {
      const oscObj = this.setupOscillator(partial, timeToAddToStart)
      for (const breakpoint of partial.breakpoints) {
        const time = Number(breakpoint.time) + timeToAddToStart
        oscObj.osc.frequency.setValueAtTime(breakpoint.freq, time)
        oscObj.gain.gain.setValueAtTime(breakpoint.amp, time)
      }
      if (this.oscillators) {
        this.oscillators.push(oscObj)
      } else {
        this.oscillators = [oscObj]
      }
    }
    this.playing = true;

  }

  setupOscillator (partial: SpearPartial, timeToAddToStart: number): OscObj {
    if (!this.audioContext) {
      throw new Error('Player.audioContext not set.')
    }

    const osc = this.audioContext.createOscillator()
    osc.type = this.waveform
    const gain = this.audioContext.createGain()

    osc.frequency.value = 0
    gain.gain.value = 0

    const oscObj: OscObj = {
      osc,
      gain,
      startTime: Number(partial.startTime) + timeToAddToStart,
      endTime: Number(partial.endTime) + timeToAddToStart,
    }

    oscObj.osc.connect(oscObj.gain);
    oscObj.gain.connect(this.audioContext.destination)

    oscObj.osc.start(oscObj.startTime)
    oscObj.osc.stop(oscObj.endTime)
    // oscObj.osc.onended = (src, gain) => this.ended(src, gain)
    oscObj.osc.onended = () => this.ended(gain)

    return oscObj
  }

  stop () {
    console.log(this.oscillators)
    if (!this.oscillators) return
    for (const oscObj of this.oscillators) {
      oscObj.osc.stop()
    }
    this.reset()
  }

  ended (gain: GainNode): void {
    const oscIndex = this.oscillators?.findIndex(oscObj => oscObj.gain = gain)
    gain.disconnect()
    if (this.oscillators && oscIndex) {
      this.oscillators.splice(oscIndex, 1);
    }
    if (!this.oscillators.length) {
      this.reset()
    }
  }

  /** 
  * Sets this.oscillators = [] and this.player = false.
  * If register is set (meaning we are not playing locally), re-register.
  */
  reset (): void {
    this.oscillators = []
    this.playing = false
    if (this.register) {
      this.register()
    }
  }

  playOneShot (now: number): void {
    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.frequency.value = 400
    osc.type = 'sawtooth'
    gain.gain.value = 0.1

    osc.connect(gain);
    gain.connect(this.audioContext.destination)

    osc.start(now)
    osc.stop(now + 0.01)
  }
}

interface OscObj {
  osc: OscillatorNode,
  gain: GainNode,
  startTime: number,
  endTime: number
}
