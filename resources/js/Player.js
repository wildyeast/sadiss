export default class Player {

  oscillators = []
  endedSrc = []

  constructor (partialData) {
    this.playing = false
    this.partialData = partialData
    this.audioContext = new(window.AudioContext || window.webkitAudioContext)()
  }

  setupOscillator(partial, startTime) {
    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.frequency.value = 0
    gain.gain.value = 0

    let time = this.now + Number(startTime);

    for (let i = 0; i < partial.breakpoints.length; i++) {
      const currentBreakpoint = partial.breakpoints[i]
      // if (times[i] - times[i-1] < 0) continue
      if (i > 0) {
        time += (currentBreakpoint.time - partial.breakpoints[i-1].time)
      }
      osc.frequency.setValueAtTime(currentBreakpoint.freq, time)
      gain.gain.setValueAtTime(currentBreakpoint.amp, time)
    }

    return {osc, gain}
  }

  play () {
    // https://www.html5rocks.com/en/tutorials/audio/scheduling/
    this.now = this.audioContext.currentTime;
    
    for (const partial of this.partialData) {
      const osc = this.setupOscillator(partial, partial.startTime)
      const oscObj = {
        osc: osc.osc,
        gain: osc.gain,
        startTime: partial.startTime,
        endTime: partial.endTime
      }
      this.oscillators.push(oscObj)
    }
    for (const oscObj of this.oscillators) {
      // Connect osc and gain to destination
      oscObj.gain.connect(this.audioContext.destination)
      oscObj.osc.connect(this.audioContext.destination)
      // Connect gain to osc 
      oscObj.osc.connect(oscObj.gain);
      
      oscObj.osc.start(this.now)
      oscObj.osc.stop(this.now + Number(oscObj.endTime))
      oscObj.osc.onended = (src) => this.ended(src)
    }
    this.playing = true
  }

  stop () {
    for (const oscObj of this.oscillators) {
      oscObj.osc.stop()
      oscObj.osc.disconnect(this.audioContext.destination)
    }
    this.reset()
  }

  ended (src) {
    this.endedSrc.push(src)
    if (this.endedSrc.length === this.partialData.length) {
      this.reset()
    }
  }

  reset () {
    this.oscillators = []
    this.endedSrc = []
    this.playing = false
  }

}
