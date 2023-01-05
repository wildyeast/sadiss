import { ref } from "vue"
import { PartialChunk, OscillatorObject, Breakpoint } from "../types/types"

export function usePlayer () {
  let ctx: AudioContext
  const oscillators: OscillatorObject[] = []
  const currentChunkStartTimeInCtxTime = ref()
  let offset: number
  let dlog: (text: string) => void

  const setLogFunction = (logFunction: (text: string) => void) => dlog = logFunction


  const initialSetup = (partialChunks: { partials: PartialChunk[], ttsInstructions: { startTime: number, text: string; }; }) => {
    handleChunkData(partialChunks)
  }

  const startAudioCtx = (globalTime: number) => {
    console.log('Starting ctx.')
    ctx = new AudioContext()
    offset = globalTime - ctx.currentTime
  }

  let startTimeInCtxTime: number

  const handleChunkData = (trackData: { partials: PartialChunk[], ttsInstructions: { startTime: number, text: string } }) => {
    console.log('\nHandling following chunk data: ', trackData)

    // TODO: This is not ideal, we shouldn't set globalStartTime every time we receive data
    currentChunkStartTimeInCtxTime.value = startTimeInCtxTime

    // dlog('Calc global startime: ' + (currentChunkStartTimeInCtxTime.value + offset + trackData.partials[0].startTime))

    for (const partialChunk of trackData.partials) {
      const oscObj = oscillators.find(el => el.index === partialChunk.index)
      if (oscObj) {
        console.log('Found osc.')
        setBreakpoints(oscObj.oscillator, oscObj.gain, partialChunk.breakpoints, startTimeInCtxTime + partialChunk.endTime)
      } else {
        console.log('Creating osc.')
        const oscNode = ctx.createOscillator()
        const gainNode = ctx.createGain()
        oscNode.connect(gainNode)
        gainNode.connect(ctx.destination)

        oscNode.start(startTimeInCtxTime + partialChunk.startTime)
        setBreakpoints(oscNode, gainNode, partialChunk.breakpoints, startTimeInCtxTime + partialChunk.endTime)

        oscNode.stop(startTimeInCtxTime + partialChunk.endTime)

        oscNode.onended = (event) => {
          const oscObj = oscillators.find(oscObj => oscObj.oscillator === event.target)
          if (oscObj) oscillators.splice(oscillators.indexOf(oscObj), 1)
        }

        oscillators.push({ index: partialChunk.index, oscillator: oscNode, gain: gainNode })
      }
    }
  }

  const setBreakpoints = (oscNode: OscillatorNode, gainNode: GainNode, breakpoints: Breakpoint[], chunkEndTime: number) => {
    oscNode.stop(chunkEndTime)
    for (const bp of breakpoints) {
      oscNode.frequency.setValueAtTime(bp.freq, currentChunkStartTimeInCtxTime.value + bp.time)
      gainNode.gain.setValueAtTime(bp.amp, currentChunkStartTimeInCtxTime.value + bp.time)
    }
  }

  const setStartTime = (startTime: number) => startTimeInCtxTime = startTime - offset

  return {
    handleChunkData,
    initialSetup,
    startAudioCtx,
    setStartTime,
    setLogFunction
  }
}
