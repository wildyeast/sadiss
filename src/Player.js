// https://www.html5rocks.com/en/tutorials/audio/scheduling/

// Schedule values I tried 50 - 1000 (step: 100) overlap time values for:
// s50 o100/200/300

// Overlap values I tried 50 - 1000 (step: 100) schedule time values for:
// 500
const SCHEDULE_TIME = 1000
const OVERLAP = 300

let lastBreakpointTime = 0

const prepared = []

let time1;

import { TimingProvider } from 'timing-provider';
import { TimingObject } from 'timing-object';

export default class Player {

  oscillators = []
  endedSrc = []
  merger = null
  audioContext = null
  playing = false
  partialData = null
  mergedBreakpoints = []
  schedulingInterval = null
  currentTime = 0
  lastScheduledBreakpointIndex = 0
  oscillatorTimes = []
  ctxTimeOnSetup = null

  offset = null

  valuesSetForFirstPartial = []

  registerFunction = null

  // mergeBreakpoints() {
  //   for (const partial of this.partialData) {
  //     for (const breakpoint of partial.breakpoints) {
  //       breakpoint.oscIndex = partial.index
  //       this.mergedBreakpoints.push(breakpoint)
  //     }
  //     this.oscillatorTimes.push(
  //       {
  //         oscIndex: partial.index,
  //         endTime: Number(partial.endTime),
  //         startTime: Number(partial.startTime)
  //       }
  //     )
  //   }
  //   this.mergedBreakpoints.sort((a, b) => a.time - b.time)
  // }

  setup(partialData, startInSec, now) {
    const timeToAddToStart = startInSec + now

    // Initialize oscillators, set all values for each oscillator
    for (const partial of partialData) {
      const oscObj = this.setupOscillator(partial, timeToAddToStart)
      for (const breakpoint of partial.breakpoints) {
        const time = Number(breakpoint.time) + timeToAddToStart
        if (partial === partialData[0]) {
          this.valuesSetForFirstPartial.push(time)
          console.log("Start time of first oscillator: ", oscObj.startTime + this.offset)
        }
        oscObj.osc.frequency.setValueAtTime(breakpoint.freq, time)
        oscObj.gain.gain.setValueAtTime(breakpoint.amp, time)
      }
      this.oscillators.push(oscObj)
      if (partial === partialData[0]) {
        console.log("audioCtx currentTime + offset after setting first set of partials: ", this.audioContext.currentTime + this.offset)
      }
    }
  }

  setupOscillator(partial, timeToAddToStart) {
    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.frequency.value = 0
    gain.gain.value = 0

    const oscObj = {
      osc,
      gain,
      startTime: Number(partial.startTime) + timeToAddToStart,
      endTime: Number(partial.endTime) + timeToAddToStart,
    }

    oscObj.osc.connect(oscObj.gain);
    oscObj.gain.connect(this.audioContext.destination)

    oscObj.osc.start(oscObj.startTime)
    oscObj.osc.stop(oscObj.endTime)
    oscObj.osc.onended = (src) => this.ended(src, oscObj.index)

    return oscObj
  }

  startFrom = 0

  stop() {
    for (const oscObj of this.oscillators) {
      oscObj.osc.stop()
    }
    this.reset()
  }

  ended(src, idx) {
    this.endedSrc.push(src)
    // const realIdx = this.oscillators.indexOf(this.oscillators.find(el => el.index === idx))
    // this.oscillators.splice(realIdx, 1)
    if (this.endedSrc.length === this.partialData.length) {
      this.reset()
    }
  }

  reset() {
    this.oscillators = []
    this.endedSrc = []
    this.playing = false

    window.clearInterval(this.schedulingInterval)
    this.currentTime = 0
    this.lastScheduledBreakpointIndex = 0

    this.registerFunction()
  }

  playOneShot(now) {
    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.frequency.value = 400
    gain.gain.value = 0.1

    osc.connect(gain);
    gain.connect(this.audioContext.destination)

    osc.start(now)
    osc.stop(now + 0.3)
  }
}
