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
  oscillatorEndTimes = []
  ctxTimeOnSetup = null

  mergeBreakpoints() {
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
    this.partialData = partialData
    const ctxTime = this.audioContext.currentTime
    const timeToAddToStart = startInSec + ctxTime
    // Initialize oscillators, set all values for each oscillator
    for (const partial of this.partialData) {
      const oscObj = this.setupOscillator(partial, timeToAddToStart)
      for (const breakpoint of partial.breakpoints) {
        const time = Number(breakpoint.time) + timeToAddToStart
        oscObj.osc.frequency.setValueAtTime(breakpoint.freq, time)
        oscObj.gain.gain.setValueAtTime(breakpoint.amp, time)
      }
      this.oscillators.push(oscObj)
    }
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
      index: partialIndex,
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

  // play () {
  //   this.playing = true
  //   console.log("Global time when calling initial schedule: ", this.timingObj.query().position)
  //   this.schedule(0.1)
  //   console.log("Global time when calling setSchedulingInterval: ", this.timingObj.query().position)
  //   this.setSchedulingInterval(SCHEDULE_TIME / 1000, SCHEDULE_TIME - OVERLAP)
  // }

  startFrom = 0

  prepare (timeInSecToScheduleInAdvance) {
    const breakpointsToSchedule = []
    const now = this.audioContext.currentTime
    // console.log(now)
    // let bp
    // while (bp = this.mergedBreakpoints.pop()) {
    //   if (bp.time > now + timeInSecToScheduleInAdvance ) {
    //     break
    //   }
    //   breakpointsToSchedule.push(bp)
    // }
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
    // console.log("Finished prepare: ", this.audioContext.currentTime) // Too many for phone
    return breakpointsToSchedule
  }

  schedule (timeInSecToScheduleInAdvance) {
    const now = performance.now()
    if (this.mergedBreakpoints[0].time < now + timeInSecToScheduleInAdvance) { // TODO: This doesn't seem to do anything.
      const breakpointsToSchedule = this.prepare(timeInSecToScheduleInAdvance)
      // console.log("Amount of oscillators currently active: ", this.oscillators.length)
      // console.log("Amount of breakpoints to schedule: ", breakpointsToSchedule.length)
      // console.log("Time", parseFloat(this.audioContext.currentTime).toFixed(3), " (+", 
      //   parseFloat(this.audioContext.currentTime - lastBreakpointTime).toFixed(3), ")")
      // lastBreakpointTime = this.audioContext.currentTime
      // console.log(" ")
      
      // const t1 = performance.now()
      for (const currentBreakpoint of breakpointsToSchedule) {
        const oscIndex = currentBreakpoint.oscIndex
        let oscObj = this.oscillators.find(osc => osc.index === oscIndex)
        // time += performance.now() - t1
        if (!oscObj) {
          oscObj = this.setupOscillator(oscIndex)
          oscObj.osc.start()
          oscObj.osc.stop(oscObj.endTime)
          oscObj.osc.onended = (src) => this.ended(src, oscObj.index)
        }
        oscObj.osc.frequency.setValueAtTime(currentBreakpoint.freq, Number(currentBreakpoint.time ))
        oscObj.gain.gain.setValueAtTime(currentBreakpoint.amp, Number(currentBreakpoint.time))
        // console.log("Total time for finding oscs for all breakpoints: ", time / this.oscillators.length)
      }
      // console.log("Total amount of time for scheduling all breakpoints this round: ", performance.now() - t1)
      // console.log(`Scheduled ${breakpointsToSchedule.length} BPs at ${this.audioContext.currentTime} this round.`,)
    }
    const t2 = performance.now()
    console.log("Current time: ", t2, "Time taken for scheduling: ", t2 - now)
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

  ended (src, idx) {
    this.endedSrc.push(src)
    const realIdx = this.oscillators.indexOf(this.oscillators.find(el => el.index === idx))
    this.oscillators.splice(realIdx, 1)
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
