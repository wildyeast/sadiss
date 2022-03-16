export default class Player {

  oscillators = []
  endedSrc = []
  merger = null
  audioContext = null
  playing = false

  constructor (partialData) {
    this.partialData = partialData
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
    // Conversion only necessary if playing from chunks sent by db (I think), not when playing all partials on one client directly
    if (typeof this.partialData === 'string') {
      this.partialData = JSON.parse(this.partialData)
      this.partialData.reverse()
    }
    console.log(this.partialData)

    this.audioContext = new(window.AudioContext || window.webkitAudioContext)()
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


    // https://stackoverflow.com/questions/59347938/webaudio-playing-two-oscillator-sounds-in-a-same-time-causes-vibration-sound
    // Create merger to merge all osc outputs into
    // this.merger = this.audioContext.createChannelMerger(this.oscillators.length)
    this.merger = new ChannelMergerNode(this.audioContext, { numberOfInputs: this.oscillators.length })
    // Connect merger to destination
    this.merger.connect(this.audioContext.destination)

    for (const [i, oscObj] of this.oscillators.entries()) {
      // Connect gain to osc 
      oscObj.osc.connect(oscObj.gain);

      // Connect osc to merger (0 meaning all going to same merger output channel)
      oscObj.osc.connect(this.merger, 0, i)
      // oscObj.osc.connect(this.audioContext.destination)

      oscObj.osc.start(this.now)
      oscObj.osc.stop(this.now + Number(oscObj.endTime))
      oscObj.osc.onended = (src) => this.ended(src)
    }
    this.playing = true
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
      this.merger.disconnect(this.audioContext)
      this.reset()
    }
  }

  reset () {
    this.oscillators = []
    this.endedSrc = []
    this.playing = false
  }
}
