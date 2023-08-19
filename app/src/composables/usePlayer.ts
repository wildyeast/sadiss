import { reactive, ref } from 'vue'
import { TextToSpeech } from '@capacitor-community/text-to-speech'
import { PartialChunk, OscillatorObject, Breakpoint } from '../types/types'

const BREAKPOINT_LENGTH = 0.01 // in seconds
const AMP_MIN_VALUE = 0.000001
const FREQ_MIN_VALUE = 0.000001

let ctx: AudioContext
let offset: number
let motion: { pos: number } = reactive({ pos: -1 })
let outputLatencyOffset = 0
let ttsLanguage: string
let waveform: OscillatorType
let ttsRate = 1

export function usePlayer() {
  const oscillators: OscillatorObject[] = []
  const currentChunkStartTimeInCtxTime = ref()

  const startAudioCtx = () => {
    console.log('Starting ctx.')
    ctx = new AudioContext()

    ctx.onstatechange = () => {
      // Resume ctx when going to sleep/background/etc preventing issue where iOS wouldn't restart playback
      // Taken from https://github.com/Tonejs/Tone.js/issues/995#issuecomment-1005082160
      // @ts-expect-error: 'interrupted' is correct here.
      if (ctx.state === 'suspended' || ctx.state === 'interrupted') {
        ctx.resume()
      }

      // When coming back from sleep/background/etc prevent playback of already past notes
      if (ctx.state === 'running') {
        stopPlayback()
      }
    }

    setOffset()
  }

  let startTimeInCtxTime: number

  const handleChunkData = async (trackData: { partials: PartialChunk[]; ttsInstructions: string }) => {
    if (!fadeOutAndStopOscillatorsInterval) {
      startFadeOutAndStopOscillatorsInterval() // Currently we leave this running until app is closed
    }

    // Set offset again to allow for ctx time drift
    setOffset()

    console.log('\nHandling following chunk data: ', trackData)

    // TODO: Refactor this
    currentChunkStartTimeInCtxTime.value = startTimeInCtxTime
    // console.log('currentChunkStartTimeInCtxTime: ', currentChunkStartTimeInCtxTime.value)

    if (trackData.partials) {
      for (const partialChunk of trackData.partials) {
        const oscObj = oscillators.find((el) => el.index === partialChunk.index)
        if (oscObj) {
          setBreakpoints(oscObj.oscillator, oscObj.gain, partialChunk.breakpoints)
          const lastBreakpointEndTime = partialChunk.breakpoints[partialChunk.breakpoints.length - 1].time
          oscObj.endTime = lastBreakpointEndTime + BREAKPOINT_LENGTH
          const lastGain = partialChunk.breakpoints[partialChunk.breakpoints.length - 1].amp
          oscObj.lastGain = lastGain
        } else {
          if (!ctx) return
          const oscNode = ctx.createOscillator()
          const gainNode = ctx.createGain()
          oscNode.connect(gainNode)
          gainNode.connect(ctx.destination)

          oscNode.type = waveform

          // Set initial gain to 0 and start osc immediately
          gainNode.gain.setValueAtTime(AMP_MIN_VALUE, ctx.currentTime)
          oscNode.start()

          setBreakpoints(oscNode, gainNode, partialChunk.breakpoints)

          const lastBreakpointEndTime = partialChunk.breakpoints[partialChunk.breakpoints.length - 1].time
          const lastGain = partialChunk.breakpoints[partialChunk.breakpoints.length - 1].amp
          oscillators.push({
            index: partialChunk.index,
            oscillator: oscNode,
            gain: gainNode,
            endTime: lastBreakpointEndTime + BREAKPOINT_LENGTH,
            lastGain
          })
        }
      }
    }

    if (trackData.ttsInstructions) {
      const tts = trackData.ttsInstructions
      console.log('Speaking: ', tts)
      await speak(tts)
    }
  }

  const setBreakpoints = (oscNode: OscillatorNode, gainNode: GainNode, breakpoints: Breakpoint[]) => {
    for (const bp of breakpoints) {
      let freqToSet = bp.freq
      let ampToSet = bp.amp
      // Set values <= 0 to 0.000001 because exponentialRampToValueAtTime doesn't work with 0 (or values less than 0)
      if (freqToSet <= 0) {
        freqToSet = FREQ_MIN_VALUE
      }
      if (ampToSet <= 0) {
        ampToSet = AMP_MIN_VALUE
      }
      oscNode.frequency.exponentialRampToValueAtTime(
        freqToSet,
        currentChunkStartTimeInCtxTime.value + bp.time + outputLatencyOffset
      )
      gainNode.gain.exponentialRampToValueAtTime(ampToSet, currentChunkStartTimeInCtxTime.value + bp.time + outputLatencyOffset)
    }
  }

  let fadeOutAndStopOscillatorsInterval: NodeJS.Timeout | null = null
  const startFadeOutAndStopOscillatorsInterval = () => {
    fadeOutAndStopOscillatorsInterval = setInterval(() => {
      for (const oscObj of oscillators) {
        const oscEndTimeReached = ctx.currentTime > startTimeInCtxTime + oscObj.endTime + outputLatencyOffset
        if (oscEndTimeReached) {
          fadeOutAndStopOscillator(oscObj)
        }
      }
    }, 100)
  }

  const fadeOutAndStopOscillator = (oscObj: OscillatorObject) => {
    oscObj.gain.gain.setValueAtTime(oscObj.lastGain, ctx.currentTime)
    oscObj.gain.gain.exponentialRampToValueAtTime(AMP_MIN_VALUE, ctx.currentTime + 0.3)
    oscObj.oscillator.stop(ctx.currentTime + 0.3)

    // Remove from array
    oscillators.splice(oscillators.indexOf(oscObj), 1)
  }

  const setStartTime = (startTime: number) => (startTimeInCtxTime = startTime - offset)

  const stopPlayback = () => {
    for (const oscObj of oscillators) {
      fadeOutAndStopOscillator(oscObj)
    }
  }

  const speak = async (text: string) => {
    await TextToSpeech.speak({
      text: text,
      lang: ttsLanguage,
      rate: ttsRate,
      pitch: 1.0,
      volume: 1.0,
      category: 'playback'
    })
  }

  const setTtsLanguage = (lang: string) => {
    ttsLanguage = lang
  }

  const setMotionRef = (motionRef: { pos: number }) => (motion = motionRef)

  const setOffset = () => (offset = motion.pos - ctx.currentTime)

  const setTrackSettings = (wf: OscillatorType, rate: string) => {
    waveform = wf
    ttsRate = +rate
  }

  const setOutputLatencyOffset = (newOutputLatencyOffset: number) => (outputLatencyOffset = newOutputLatencyOffset)

  return {
    handleChunkData,
    startAudioCtx,
    setStartTime,
    setTtsLanguage,
    setMotionRef,
    setTrackSettings,
    stopPlayback,
    setOffset,
    setOutputLatencyOffset
  }
}
