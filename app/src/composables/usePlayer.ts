import { reactive, ref } from 'vue'
import { TextToSpeech } from '@capacitor-community/text-to-speech'
import { PartialChunk, OscillatorObject, Breakpoint } from '../types/types'

let ctx: AudioContext
let offset: number
let motion: { pos: number } = reactive({ pos: -1 })
let outputLatencyOffset = 0
let ttsLanguage: string

export function usePlayer() {
  const oscillators: OscillatorObject[] = []
  const currentChunkStartTimeInCtxTime = ref()

  const initialSetup = (partialChunks: { partials: PartialChunk[]; ttsInstructions: string }) => {
    handleChunkData(partialChunks)
  }

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
    // Set offset again to allow for ctx time drift
    setOffset()

    // console.log('\nHandling following chunk data: ', trackData)

    // TODO: Refactor this
    currentChunkStartTimeInCtxTime.value = startTimeInCtxTime
    console.log('currentChunkStartTimeInCtxTime: ', currentChunkStartTimeInCtxTime.value)

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
    oscNode.stop(chunkEndTime + outputLatencyOffset)
    for (const bp of breakpoints) {
      oscNode.frequency.setValueAtTime(bp.freq, currentChunkStartTimeInCtxTime.value + bp.time + outputLatencyOffset)
      gainNode.gain.setValueAtTime(bp.amp, currentChunkStartTimeInCtxTime.value + bp.time + outputLatencyOffset)
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

  const setTtsLanguage = (lang: string) => {
    ttsLanguage = lang
  }

  const setMotionRef = (motionRef: { pos: number }) => (motion = motionRef)

  const setOffset = () => {
    console.log(motion.pos, ctx.currentTime)
    offset = motion.pos - ctx.currentTime
    console.log('Offset: ', offset)
  }

  let waveform: OscillatorType
  let ttsRate = 1
  const setTrackSettings = (wf: OscillatorType, rate: string) => {
    waveform = wf
    ttsRate = +rate
  }

  const setOutputLatencyOffset = (newOutputLatencyOffset: number) => (outputLatencyOffset = newOutputLatencyOffset)

  return {
    handleChunkData,
    initialSetup,
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
