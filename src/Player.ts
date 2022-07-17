import { SpearPartial } from "./types/SpearPartial"

export default class Player {

  audioContext: AudioContext
  partialData: SpearPartial[] = []
  playing = false
  offset = 0
  oscillators: { oscNode: OscillatorNode, gainNode: GainNode, startTime: number, endTime: number }[] = []
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
    // This is necessary to make audio playback work on iOS.
    this.audioContext.resume()
  }

  setup (partialData: SpearPartial[], startInSec: number, now: number, outputLatency: number) {
    this.partialData = partialData
    const timeToAddToStart = now + outputLatency + startInSec

    // Initialize oscillators, set all values for each oscillator
    for (const partial of partialData) {
      const oscObj = this.setupOscillator(partial, timeToAddToStart)
      for (const breakpoint of partial.breakpoints) {
        const time = breakpoint.time + timeToAddToStart
        oscObj.oscNode.frequency.setValueAtTime(breakpoint.freq, time)
        oscObj.gainNode.gain.setValueAtTime(breakpoint.amp, time)
      }
      this.oscillators.push(oscObj)
    }
    this.playing = true;

  }

  setupOscillator (partial: SpearPartial, timeToAddToStart: number): OscObj {
    if (!this.audioContext) {
      throw new Error('Player.audioContext not set.')
    }

    const oscNode = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscNode.type = this.waveform
    oscNode.frequency.value = 0
    gainNode.gain.value = 0

    const oscObj: OscObj = {
      oscNode,
      gainNode,
      startTime: Number(partial.startTime) + timeToAddToStart,
      endTime: Number(partial.endTime) + timeToAddToStart,
    }

    oscObj.oscNode.connect(oscObj.gainNode);
    oscObj.gainNode.connect(this.audioContext.destination)

    oscObj.oscNode.start(oscObj.startTime)
    oscObj.oscNode.stop(oscObj.endTime)
    // oscObj.oscNode.onended = (src, gainNode) => this.ended(src, gainNode)
    oscObj.oscNode.onended = () => this.ended(gainNode)

    return oscObj
  }

  stop () {
    console.log(this.oscillators)
    if (!this.oscillators) return
    for (const oscObj of this.oscillators) {
      oscObj.oscNode.stop()
    }
    this.reset()
  }

  ended (gainNode: GainNode): void {
    const oscIndex = this.oscillators?.findIndex(oscObj => oscObj.gainNode = gainNode)
    gainNode.disconnect()
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
    const oscNode = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscNode.frequency.value = 400
    oscNode.type = 'sawtooth'
    gainNode.gain.value = 0.1

    oscNode.connect(gainNode);
    gainNode.connect(this.audioContext.destination)

    oscNode.start(now)
    oscNode.stop(now + 0.01)
  }
}

interface OscObj {
  oscNode: OscillatorNode,
  gainNode: GainNode,
  startTime: number,
  endTime: number
}
