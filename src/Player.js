// https://www.html5rocks.com/en/tutorials/audio/scheduling/

const SCHEDULE_TIME = 200
const OVERLAP = 100

let lastBreakpointTime = 0

const prepared = []

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

  mergeBreakpoints(partialData) {
    // Conversion only necessary if playing from chunks sent by db (I think), not when playing all partials on one client directly
    if (typeof partialData === 'string') {
      this.partialData = JSON.parse(partialData)
      this.partialData.reverse()
    } else {
      this.partialData = partialData
    }
    for (const partial of this.partialData) {
      for (const breakpoint of partial.breakpoints) {
        breakpoint.oscIndex = partial.index
        this.mergedBreakpoints.push(breakpoint)
      }
      this.oscillatorEndTimes.push(
        {
          oscIndex: partial.index,
          endTime: Number(partial.endTime)
        }
      )
    }
    this.mergedBreakpoints.sort((a, b) => b.time < a.time)
  }

  setup () {
    this.audioContext = new(window.AudioContext || window.webkitAudioContext)()
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

  play () {
    // console.log("Partial Data: ", this.partialData)
    // for (const oscObj of this.oscillators) {
    //   // oscObj.osc.start(0)
    //   oscObj.osc.stop(oscObj.endTime)
    //   oscObj.osc.onended = (src) => this.ended(src)
    // }
    this.playing = true
    this.setSchedulingInterval(SCHEDULE_TIME / 1000, SCHEDULE_TIME - OVERLAP)
  }

  prepare (timeInSecToScheduleInAdvance) {
    const breakpointsToSchedule = []
    for (const bp of this.mergedBreakpoints) {
      if (bp.time >= this.audioContext.currentTime && bp.time < this.audioContext.currentTime + timeInSecToScheduleInAdvance) {
        breakpointsToSchedule.push(bp)
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
          oscObj.osc.start()
          oscObj.osc.stop(oscObj.endTime)
          oscObj.osc.onended = (src) => this.ended(src, oscObj.index)
        }
        oscObj.osc.frequency.setValueAtTime(currentBreakpoint.freq, Number(currentBreakpoint.time))
        oscObj.gain.gain.setValueAtTime(currentBreakpoint.amp, Number(currentBreakpoint.time))

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

  ended (src, idx) {
    this.endedSrc.push(src)
    const realIdx = this.oscillators.indexOf(this.oscillators.find(el => el.index === idx))
    this.oscillators.splice(realIdx, 1)
    if (this.endedSrc.length === this.partialData.length) {
      // this.merger.disconnect(this.audioContext)
      // console.log('prepared', prepared)
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
}
