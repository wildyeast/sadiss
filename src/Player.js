// https://www.html5rocks.com/en/tutorials/audio/scheduling/

const SCHEDULE_TIME = 400
const OVERLAP = 200

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
  oscillatorEndTimes = []
  ctxTimeOnSetup = null

  constructor() {
    this.timingProvider = new TimingProvider('wss://sadiss.net/zeitquelle');
    this.timingObj = new TimingObject(this.timingProvider)
    this.timingObj.onchange =  () => {
      // console.log(this.timingObj.query().position - this.localTimingObj.query().position)
      console.log("Player: Global time object changed.")
    };
  }

  mergeBreakpoints() {
    console.log(this.partialData)
    for (const partial of this.partialData) {
      for (const breakpoint of partial.breakpoints) {
        breakpoint.oscIndex = partial.index
        this.mergedBreakpoints.push(breakpoint)
      }
      this.oscillatorEndTimes.push(
        {
          oscIndex: partial.index,
          endTime: Number(partial.endTime),
        }
      )
    }
    this.mergedBreakpoints.sort((a, b) => a.time - b.time)
  }

  setup (partialData, startInSec, offset) {
    const t1 = performance.now()
    this.partialData = partialData
    const ctxTime = this.audioContext.currentTime
    const timeToAddToStart = startInSec + ctxTime
    let totalTime = 0
    // Initialize oscillators, set all values for each oscillator
    for (const partial of this.partialData) {
      const t2 = performance.now()
      const oscObj = this.setupOscillator(partial, timeToAddToStart)
      for (const breakpoint of partial.breakpoints) {
        const time = Number(breakpoint.time) + timeToAddToStart
        oscObj.osc.frequency.setValueAtTime(breakpoint.freq, time)
        oscObj.gain.gain.setValueAtTime(breakpoint.amp, time)
      }
      this.oscillators.push(oscObj)
      totalTime += performance.now() - t2
    }
    // console.log("Finished osc setup and value setting. Duration (ms): ", performance.now() - t1)
    // console.log("Average time (ms) to initialize osc and set values for one partial:", totalTime / this.oscillators.length)
    console.log("Global time after finishing setup: ", this.timingObj.query().position)
  }

  setupOscillator(partialIndex) {
    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.frequency.value = 0
    gain.gain.value = 0

    const oscObj = {
      osc,
      gain,
      endTime: this.oscillatorEndTimes.find(el => el.oscIndex === partialIndex).endTime,
    }

    oscObj.osc.connect(oscObj.gain);
    oscObj.gain.connect(this.audioContext.destination)

    this.oscillators.push(oscObj)

    return oscObj
  }

  // setupOscillator(partial, timeToAddToStart) {
  //   const osc = this.audioContext.createOscillator()
  //   const gain = this.audioContext.createGain()

  //   osc.frequency.value = 0
  //   gain.gain.value = 0

  //   const oscObj = {
  //     osc,
  //     gain,
  //     startTime: Number(partial.startTime) + timeToAddToStart,
  //     endTime: Number(partial.endTime) + timeToAddToStart,
  //   }

  //   oscObj.osc.connect(oscObj.gain);
  //   oscObj.gain.connect(this.audioContext.destination)

  //   oscObj.osc.start(oscObj.startTime)
  //   oscObj.osc.stop(oscObj.endTime)
  //   oscObj.osc.onended = (src) => this.ended(src, oscObj.index)

  //   return oscObj
  // }

  play () {
    this.playing = true
    this.setSchedulingInterval(SCHEDULE_TIME / 1000, SCHEDULE_TIME - OVERLAP)
    // console.log("Starting oscillators")
    // for (const oscObj of this.oscillators) {
    //   oscObj.osc.start(oscObj.startTime)
    //   oscObj.osc.stop(oscObj.endTime)
    //   oscObj.osc.onended = (src) => this.ended(src, oscObj.index)
    // }
  }

  startFrom = 0

  prepare (timeInSecToScheduleInAdvance) {
    const breakpointsToSchedule = []
    const now = this.audioContext.currentTime
    for (let i = this.startFrom; i < this.mergedBreakpoints.length; i++) {
      const bp = this.mergedBreakpoints[i]
      if (bp.time >= now) {
        if (bp.time < now + timeInSecToScheduleInAdvance) {
          breakpointsToSchedule.push(bp)
        } else {
          this.startFrom = i
          break
        }
      }
    }
    return breakpointsToSchedule
  }

  schedule (timeInSecToScheduleInAdvance) {
      const breakpointsToSchedule = this.prepare(timeInSecToScheduleInAdvance)
      // console.log("Amount of oscillators currently active: ", this.oscillators.length)
      // console.log("Amount of breakpoints to schedule: ", breakpointsToSchedule.length)
      // console.log("Time", parseFloat(this.audioContext.currentTime).toFixed(3), " (+", 
      //   parseFloat(this.audioContext.currentTime - lastBreakpointTime).toFixed(3), ")")
      // lastBreakpointTime = this.audioContext.currentTime
      // console.log(" ")

      for (const currentBreakpoint of breakpointsToSchedule) {
        const oscIndex = currentBreakpoint.oscIndex
        let oscObj = this.oscillators.find(osc => osc.index === oscIndex)
        if (!oscObj) {
          oscObj = this.setupOscillator(oscIndex)
          console.log(oscObj)
          oscObj.osc.start()
          oscObj.osc.stop(oscObj.endTime)
          oscObj.osc.onended = (src) => this.ended(src)
        }
        oscObj.osc.frequency.setValueAtTime(currentBreakpoint.freq, Number(currentBreakpoint.time + 5))
        oscObj.gain.gain.setValueAtTime(currentBreakpoint.amp, Number(currentBreakpoint.time + 5))

      }
  }

  setSchedulingInterval (timeInSecToScheduleInAdvance, intervalTimeInMs) {
    this.schedulingInterval = window.setInterval(() => {
      this.schedule(timeInSecToScheduleInAdvance)
    }, intervalTimeInMs)
  }

  stop () {
    for (const oscObj of this.oscillators) {
      oscObj.osc.stop()
    }
    this.reset()
  }

  ended (src) {
    this.endedSrc.push(src)
    const realIdx = this.oscillators.indexOf(this.oscillators.find(el => el.index === idx))
    this.oscillators.splice(realIdx, 1)
    // const realIdx = this.oscillators.indexOf(this.oscillators.find(el => el.index === idx))
    // this.oscillators.splice(realIdx, 1)
    if (this.endedSrc.length === this.partialData.length) {
      this.reset()
    }
  }

  reset () {
    this.oscillators = []
    this.endedSrc = []
    this.playing = false

    window.clearInterval(this.schedulingInterval)
    this.currentTime = 0
    this.lastScheduledBreakpointIndex = 0
  }

  printTime (name, offset) {
    console.log(name, this.audioContext.currentTime - offset)
  }

}
