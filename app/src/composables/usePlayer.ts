import { reactive, ref } from 'vue'
import { TextToSpeech } from '@capacitor-community/text-to-speech'
import { PartialChunk, OscillatorObject, Breakpoint } from '../types/types'

export function usePlayer() {
  let ctx: AudioContext
  const oscillators: OscillatorObject[] = []
  const currentChunkStartTimeInCtxTime = ref()
  let offset: number
  let dlog: (text: string) => void

  const setLogFunction = (logFunction: (text: string) => void) => (dlog = logFunction)

  const initialSetup = (partialChunks: { partials: PartialChunk[]; ttsInstructions: string }) => {
    handleChunkData(partialChunks)
  }

  const startAudioCtx = () => {
    console.log('Starting ctx.')
    ctx = new AudioContext()

    ctx.onstatechange = () => {
      dlog('Ctx state changed to: ' + ctx.state)
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
    // Set offset again to allow for ctx time drift
    setOffset()

    // console.log('\nHandling following chunk data: ', trackData)

    // TODO: Refactor this
    currentChunkStartTimeInCtxTime.value = startTimeInCtxTime

    if (trackData.partials) {
      for (const partialChunk of trackData.partials) {
        const oscObj = oscillators.find((el) => el.index === partialChunk.index)
        if (oscObj) {
          console.log('Found osc.')
          setBreakpoints(oscObj.oscillator, oscObj.gain, partialChunk.breakpoints, startTimeInCtxTime + partialChunk.endTime)
        } else {
          if (!ctx) return
          console.log('Creating osc.')
          const oscNode = ctx.createOscillator()
          const gainNode = ctx.createGain()
          oscNode.connect(gainNode)
          gainNode.connect(ctx.destination)

          oscNode.type = waveform

          oscNode.start(startTimeInCtxTime + partialChunk.startTime)
          setBreakpoints(oscNode, gainNode, partialChunk.breakpoints, startTimeInCtxTime + partialChunk.endTime)

          oscNode.stop(startTimeInCtxTime + partialChunk.endTime)

          oscNode.onended = (event) => {
            const oscObj = oscillators.find((oscObj) => oscObj.oscillator === event.target)
            if (oscObj) oscillators.splice(oscillators.indexOf(oscObj), 1)
          }

          oscillators.push({ index: partialChunk.index, oscillator: oscNode, gain: gainNode })
        }
      }
    }

    if (trackData.ttsInstructions) {
      const tts = trackData.ttsInstructions
      console.log('Speaking: ', tts)
      await speak(tts)
    }
  }

  const setBreakpoints = (oscNode: OscillatorNode, gainNode: GainNode, breakpoints: Breakpoint[], chunkEndTime: number) => {
    oscNode.stop(chunkEndTime)
    for (const bp of breakpoints) {
      oscNode.frequency.setValueAtTime(bp.freq, currentChunkStartTimeInCtxTime.value + bp.time)
      gainNode.gain.setValueAtTime(bp.amp, currentChunkStartTimeInCtxTime.value + bp.time)
    }
  }

  const setStartTime = (startTime: number) => (startTimeInCtxTime = startTime - offset)

  const stopPlayback = () => {
    for (const osc of oscillators) {
      osc.oscillator.stop()
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

  let ttsLanguage: string
  const setTtsLanguage = (lang: string) => {
    ttsLanguage = lang
  }

  let motion: { pos: number } = reactive({ pos: -1 })
  const setMotionRef = (motionRef: { pos: number }) => (motion = motionRef)
  const setOffset = () => (offset = motion.pos - ctx.currentTime)

  let waveform: OscillatorType
  let ttsRate = 1
  const setTrackSettings = (wf: OscillatorType, rate: string) => {
    waveform = wf
    ttsRate = +rate
  }

  const getDebugData = () => {
    const ctxTime = ctx ? ctx.currentTime : undefined
    return {
      ctxTime,
      offset
    }
  }

  let continuousOscObj: Omit<OscillatorObject, 'index'> | null
  const playContinuousSound = () => {
    if (!ctx) return

    const osc = ctx.createOscillator()
    osc.frequency.setValueAtTime(440, ctx.currentTime)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.05, ctx.currentTime)
    osc.connect(gain)
    gain.connect(ctx.destination)
    continuousOscObj = {
      oscillator: osc,
      gain
    }
    osc.start()
  }

  const stopContinuousSound = () => {
    if (!continuousOscObj) return
    continuousOscObj.oscillator.stop()
    continuousOscObj = null
  }

  return {
    handleChunkData,
    initialSetup,
    startAudioCtx,
    setStartTime,
    setLogFunction,
    setTtsLanguage,
    setMotionRef,
    setTrackSettings,
    getDebugData,
    stopPlayback,
    playContinuousSound,
    stopContinuousSound,
    setOffset
  }
}
