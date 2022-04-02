// https://www.html5rocks.com/en/tutorials/audio/scheduling/

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
    this.partialData = partialData
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
    const amountOfTimeToScheduleInitially = this.minStartTime + 0.05 // in seconds

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

    // let time = this.now + Number(startTime);

    // console.log(partial.breakpoints.length)

    // for (let i = 0; i < partial.breakpoints.length; i++) {
    //   const currentBreakpoint = partial.breakpoints[i]
    //   // if (times[i] - times[i-1] < 0) continue
    //   if (i > 0) {
    //     time += (currentBreakpoint.time - partial.breakpoints[i-1].time)
    //   }
    //   osc.frequency.setValueAtTime(currentBreakpoint.freq, time)
    //   gain.gain.setValueAtTime(currentBreakpoint.amp, time)
    // }

    return {osc, gain}
  }

  play () {
    // Conversion only necessary if playing from chunks sent by db (I think), not when playing all partials on one client directly
    // if (typeof this.partialData === 'string') {
    //   this.partialData = JSON.parse(this.partialData)
    //   this.partialData.reverse()
    // }
    // console.log("Partial Data: ", this.partialData)


    // this.now = this.audioContext.currentTime;
    for (const oscObj of this.oscillators) {
      oscObj.osc.start(0)
      oscObj.osc.stop(oscObj.endTime)
      oscObj.osc.onended = (src) => this.ended(src)
    }
    this.playing = true



    this.schedulingInterval = window.setInterval(() => {
      const breakpointsToSchedule = this.mergedBreakpoints
        .slice(this.lastScheduledBreakpointIndex)
        .filter(breakpoint => breakpoint.time < this.audioContext.currentTime + 0.15)
      console.log("Amount of breakpoints to schedule: ", breakpointsToSchedule.length)
      console.log(this.audioContext.currentTime)

      // console.log(breakpointsToSchedule.map(item => item.time), this.currentTime)

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
      // this.currentTime += 0.150
      // console.log(breakpointsToSchedule.length)
    }, 75)

  }

  schedule (timeInSecToScheduleInAdvance) {
    const breakpointsToSchedule = this.mergedBreakpoints
        .slice(this.lastScheduledBreakpointIndex)
        .filter(breakpoint => breakpoint.time < this.audioContext.currentTime + timeInSecToScheduleInAdvance)
      console.log("Amount of breakpoints to schedule: ", breakpointsToSchedule.length)
      console.log(this.audioContext.currentTime)

      // console.log(breakpointsToSchedule.map(item => item.time), this.currentTime)

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
