export default class Player {

  oscillators = []
  endedSrc = []
  merger = null
  audioContext = null
  playing = false
  partialData = null

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
    console.log("Partial Data: ", this.partialData)

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

    // TODO:
    // Problem: Connecting multiple oscillators to the destination directly produces really bad audio quality on phones.
    // At this moment, I have discovered two ways of improving the audio quality on phones.
    // 1. Using a ChannelMergerNode: This heavily improves the audio quality, making it sound like on laptop speakers.
    //    At the same time, partials are lost. ATM I don't know how many partials are played when all oscillators are merged
    //    with the same ChannelMergerNode, but e.g. 12 is too much.
    //    UPDATE: ChannelMergerNode does not actually help. AFAICT CompressorNode is our best (and maybe only) option now.
    // 2. Using a DynamicsCompressorNode: This improves audio quality, but there is still some buzzing/crackling. No partials
    //    are lost using this approach.
    // What we probably need is a lot of testing and a deeper understanding of how ChannelMergerNode and DynamicsCompressorNode
    // work. One approach might be to use the Merger if the device has only a few partials to play and to use the Compressor if there
    // are more.
    // UPDATE: If there are two or less partials, we can assign one partial to the left channel and one to the right channel
    // with ChannelMergerNode, resulting in really clean sound. The distortion problem arises when more than one partial is assigned to
    // a channel, ChannelMergerNode does not help with that at all.
    // Currently I haven't tested the Compressor with anything but default settings. These settings don't create too much of an
    // audible difference (if any) in sound, but I can't be sure right now.
    // https://stackoverflow.com/questions/59347938/webaudio-playing-two-oscillator-sounds-in-a-same-time-causes-vibration-sound
    // https://stackoverflow.com/questions/29901577/distorted-audio-in-ios-7-1-with-webaudio-api

    // Create merger to merge all osc outputs into

    // Use one of the next two lines for ChannelMergerNode (two methods yielding same result)
    // this.merger = this.audioContext.createChannelMerger(this.oscillators.length)
    // this.merger = new ChannelMergerNode(this.audioContext, { numberOfInputs: this.oscillators.length})
    
    // Use next line for DynamicsCompressorNode
    this.merger = new DynamicsCompressorNode(this.audioContext)

    // Connect merger (which depending on code above can be Merger or Compressor)
    this.merger.connect(this.audioContext.destination)

    for (const [i, oscObj] of this.oscillators.entries()) {
      // Connect gain to osc 
      oscObj.osc.connect(oscObj.gain);

      // Use next line for ChannelMergerNode
      // const outputChannel = i % 2;
      // console.log(outputChannel)
      // oscObj.osc.connect(this.merger, 0, outputChannel)

      // Use next line for DynamicsCompressorNode
      oscObj.gain.connect(this.merger, 0, 0)

      // Use next line for connecting oscillators to destination directly
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
      // this.merger.disconnect(this.audioContext)
      this.reset()
    }
  }

  reset () {
    this.oscillators = []
    this.endedSrc = []
    this.playing = false
  }
}
