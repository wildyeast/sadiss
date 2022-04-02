// https://www.html5rocks.com/en/tutorials/audio/scheduling/

const SCHEDULE_TIME = 800
const OVERLAP = 0

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
  minStartTime = null

  setup (partialData) {
    // Conversion only necessary if playing from chunks sent by db (I think), not when playing all partials on one client directly
    if (typeof partialData === 'string') {
      this.partialData = JSON.parse(partialData)
      this.partialData.reverse()
    } else {
      this.partialData = partialData
    }
    // console.log(partialData)
    this.audioContext = new(window.AudioContext || window.webkitAudioContext)()
    for (const partial of partialData) {
      const { osc, gain } = this.setupOscillator()

      for (const breakpoint of partial.breakpoints) {
        breakpoint.oscIndex = partial.index
        this.mergedBreakpoints.push(breakpoint)
      }
      
      const oscObj = {
        osc,
        gain,
        index: partial.index,
        endTime: Number(partial.endTime),
      }

      oscObj.osc.connect(oscObj.gain);
      oscObj.gain.connect(this.audioContext.destination)

      this.minStartTime = this.minStartTime < partial.startTime ? this.minStartTime : Number(partial.startTime)

      this.oscillators.push(oscObj)
    }

    this.mergedBreakpoints.sort((a, b) => b.time < a.time)

    // let time = this.audioContext.currentTime
    const amountOfTimeToScheduleInitially = SCHEDULE_TIME / 1000 // in seconds

    const breakpointsToSchedule = this.mergedBreakpoints.filter(breakpoint => breakpoint.time < amountOfTimeToScheduleInitially)
    // console.log("Amount of breakpoints to schedule:", breakpointsToSchedule.length)

    for (let i = 0; i < breakpointsToSchedule.length; i++) {
      const currentBreakpoint = breakpointsToSchedule[i]
      // time += Number(currentBreakpoint.time)
      // console.log(time)
      const oscIndex = currentBreakpoint.oscIndex
      const oscObj = this.oscillators.filter(osc => osc.index === oscIndex)[0]
      if (!oscObj) break;
      oscObj.osc.frequency.setValueAtTime(currentBreakpoint.freq, Number(currentBreakpoint.time))
      oscObj.gain.gain.setValueAtTime(currentBreakpoint.amp, Number(currentBreakpoint.time))

      this.lastScheduledBreakpointIndex++
    }
    
    // this.currentTime = amountOfTimeToScheduleInitially
    console.log("Initial breakpoints set. Starting scheduling. lastScheduledBreakpointIndex:", this.lastScheduledBreakpointIndex)

    // for (let i = 0; i < initiallySetBreakpointsCount; i++) {
    //   const currentBreakpoint = this.mergedBreakpoints[i]
    //   // time += Number(currentBreakpoint.time)
    //   // console.log(time)
    //   const oscIndex = currentBreakpoint.oscIndex
    //   const oscObj = this.oscillators.filter(osc => osc.index === oscIndex)[0]
    //   oscObj.osc.frequency.setValueAtTime(currentBreakpoint.freq, Number(currentBreakpoint.time))
    //   oscObj.gain.gain.setValueAtTime(currentBreakpoint.amp, Number(currentBreakpoint.time))

    //   oscObj.osc.connect(oscObj.gain);
    //   oscObj.gain.connect(this.audioContext.destination)

    //   this.currentTime = currentBreakpoint.time
    //   this.lastScheduledBreakpointIndex++
    // }

    this.play()

  }

  setupOscillator() {
    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.frequency.value = 0
    gain.gain.value = 0

    return {osc, gain}
  }

  play () {
    // console.log("Partial Data: ", this.partialData)


    // this.now = this.audioContext.currentTime;
    for (const oscObj of this.oscillators) {
      oscObj.osc.start(0)
      oscObj.osc.stop(oscObj.endTime)
      oscObj.osc.onended = (src) => this.ended(src)
    }
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

    /*
    const breakpointsToSchedule2 = this.mergedBreakpoints
      .slice(this.lastScheduledBreakpointIndex)
      .filter(breakpoint => breakpoint.time < this.audioContext.currentTime + timeInSecToScheduleInAdvance)
    */
    // prepared.push(breakpointsToSchedule)
    console.log(' ')
    //console.log('index', this.lastScheduledBreakpointIndex)
    console.log(breakpointsToSchedule)
    return breakpointsToSchedule
    /*for (const currentBreakpoint of breakpointsToSchedule) {
      this.lastScheduledBreakpointIndex++
    }*/
  }

  schedule (timeInSecToScheduleInAdvance) {
      const breakpointsToSchedule = this.prepare(timeInSecToScheduleInAdvance)
      console.log("Amount of breakpoints to schedule: ", breakpointsToSchedule.length)
      console.log("Time", parseFloat(this.audioContext.currentTime).toFixed(3), " (+", 
        parseFloat(this.audioContext.currentTime - lastBreakpointTime).toFixed(3), ")")
      lastBreakpointTime = this.audioContext.currentTime
      console.log("")

      for (const currentBreakpoint of breakpointsToSchedule) {
        const oscIndex = currentBreakpoint.oscIndex
        const oscObj = this.oscillators.find(osc => osc.index === oscIndex)
        if (!oscObj) break;
        oscObj.osc.frequency.setValueAtTime(currentBreakpoint.freq, Number(currentBreakpoint.time))
        oscObj.gain.gain.setValueAtTime(currentBreakpoint.amp, Number(currentBreakpoint.time))

        // this.lastScheduledBreakpointIndex++
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
    if (this.endedSrc.length === this.partialData.length) {
      // this.merger.disconnect(this.audioContext)
      console.log('prepared', prepared)
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
