import { ref, computed } from "vue"
import { PartialChunk, OscillatorObject, Breakpoint } from "../types/types"

export function usePlayer () {
  let ctx: AudioContext
  const oscillators: OscillatorObject[] = []
  const currentChunkStartTimeInCtxTime = ref()
  let globalStartTime: number
  let offset: number
  let waitingForChunks = false

  const initialSetup = (partialChunks: { partials: PartialChunk[], ttsInstructions: { startTime: number, text: string; }; }) => {
    handleChunkData(partialChunks)
  }

  const startAudioCtx = (globalTime: number) => {
    console.log('Starting ctx.')
    ctx = new AudioContext()
    offset = globalTime - ctx.currentTime
  }

  const startTimeInCtxTime = computed(() => globalStartTime - offset)

  let numberOfChunksHandled = 0
  const MAXIMUM_CHUNK_LENGTH_MS = 999
  const handleChunkData = (trackData: { partials: PartialChunk[], ttsInstructions: { startTime: number, text: string } }) => {
    console.log('\nHandling following chunk data: ', trackData)

    currentChunkStartTimeInCtxTime.value = startTimeInCtxTime.value + trackData.partials[0].startTime / 1000

    for (const partialChunk of trackData.partials) {
      if (oscillators.length && partialChunk.endTime === numberOfChunksHandled * 1000 + MAXIMUM_CHUNK_LENGTH_MS) {
        // Only assign new partialChunk to found oscillator if last breakpoint of partialChunk ends
        // MAXIMUM_CHUNK_LENGTH_MS after chunk start.
        // In this case we assume this is part of a longer partial and stitch the parts
        // together seamlessly.
        const oscObj = oscillators.find(el => el.index === partialChunk.index)
        if (oscObj) {
          console.log('Found osc.')
          setBreakpoints(oscObj.oscillator, oscObj.gain, partialChunk.breakpoints, startTimeInCtxTime.value + partialChunk.endTime / 1000)
        }
      } else {
        console.log('Creating osc.')
        const oscNode = ctx.createOscillator()
        const gainNode = ctx.createGain()
        oscNode.connect(gainNode)
        gainNode.connect(ctx.destination)

        oscNode.start(currentChunkStartTimeInCtxTime.value)
        setBreakpoints(oscNode, gainNode, partialChunk.breakpoints, startTimeInCtxTime.value + partialChunk.endTime / 1000)

        oscNode.stop(startTimeInCtxTime.value + partialChunk.endTime / 1000)
        oscNode.onended = (event) => {
          const oscObj = oscillators.find(oscObj => oscObj.oscillator === event.target)
          if (oscObj) oscillators.splice(oscillators.indexOf(oscObj), 1)
        }
        oscillators.push({ index: partialChunk.index, oscillator: oscNode, gain: gainNode })
      }
    }
    numberOfChunksHandled++
  }

  const setBreakpoints = (oscNode: OscillatorNode, gainNode: GainNode, breakpoints: Breakpoint[], chunkEndTime: number) => {
    oscNode.stop(chunkEndTime)
    for (const bp of breakpoints) {
      oscNode.frequency.setValueAtTime(bp.freq, currentChunkStartTimeInCtxTime.value)
      gainNode.gain.setValueAtTime(bp.amp, currentChunkStartTimeInCtxTime.value)
    }
  }

  // TODO: Refactor this as a computed with toRef(ctx.currentTime, 'ctxTime')
  // https://stackoverflow.com/questions/66504701/how-to-make-a-vue-3-object-property-reactive
  const shouldRequestChunks = () => {
    return currentChunkStartTimeInCtxTime.value < ctx.currentTime && !waitingForChunks
  }

  const chunksRequested = () => waitingForChunks = true

  const setStartTime = (startTime: number) => globalStartTime = startTime

  return {
    chunksRequested,
    handleChunkData,
    initialSetup,
    shouldRequestChunks,
    startAudioCtx,
    setStartTime
  }
}
