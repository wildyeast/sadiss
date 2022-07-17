export default class Player {

  audioContext = null
  endedSrc = []
  partialData = null
  playing = false
  playingLocally = false
  offset = null
  oscillators = []
  registerFunction = null
  valuesSetForFirstPartial = []
  waveform = 'sine'

  setup(partialData, startInSec, now, playingLocally = false) {
    this.partialData = partialData
    const timeToAddToStart = startInSec + now

    if (playingLocally) {
      this.playingLocally = true
    }

    // Initialize oscillators, set all values for each oscillator
    for (const partial of partialData) {
      const oscObj = this.setupOscillator(partial, timeToAddToStart)
      // const times = []
      for (const breakpoint of partial.breakpoints) {
        const time = Number(breakpoint.time) + timeToAddToStart
        // times.push(time)
        // if (partial === partialData[0]) {
        //   console.log("Start time of first oscillator: ", oscObj.startTime + this.offset)
        // }
        oscObj.osc.frequency.setValueAtTime(breakpoint.freq, time)
        oscObj.gain.gain.setValueAtTime(breakpoint.amp, time)
      }
      this.oscillators.push(oscObj)
      if (partial === partialData[0]) {
        console.log("audioCtx currentTime + offset after setting first set of partials: ", this.audioContext.currentTime + this.offset)
      }
      // this.valuesSetForFirstPartial.push(times)
    }
    this.playing = true;
    // console.log(this.oscillators.map(val => val.startTime + this.offset))

  }

  setupOscillator(partial, timeToAddToStart) {
    const osc = this.audioContext.createOscillator()
    osc.type = this.waveform
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
    // oscObj.osc.onended = (src, gain) => this.ended(src, gain)
    oscObj.osc.onended = (src) => this.ended(src, gain)

    return oscObj
  }

  stop() {
    for (const oscObj of this.oscillators) {
      oscObj.osc.stop()
    }
    this.reset()
  }

  ended(src, gain) {
    this.endedSrc.push(src)
    gain.disconnect()
    // oscObj.gain.disconnect()
    if (this.endedSrc.length === this.partialData.length) {
      this.reset()
    }
  }

  reset() {
    this.oscillators = []
    this.endedSrc = []
    this.playing = false
    if (!this.playingLocally) {
      this.registerFunction()
    }
  }

  playOneShot(now) {
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
