import { ref } from "vue"
import { PartialChunk, OscillatorObject, Breakpoint } from "../types/types"

export function usePlayer () {
  const ctx = ref<AudioContext>()
  const oscillators: OscillatorObject[] = []
  const currentChunkStartTimeInCtxTime = ref()
  let globalStartTime: number
  let offset: number
  let waitingForChunks = false

  const initialSetup = (partialChunks: PartialChunk[]) => {
    if (!ctx.value) return
    handleChunkData(partialChunks)
  }

  const startAudioCtx = (globalTime: number) => {
    console.log('Starting ctx.')
    ctx.value = new AudioContext()
    offset = globalTime - ctx.value.currentTime
  }

  const MAXIMUM_CHUNK_LENGTH_MS = 999
  const handleChunkData = (partialChunks: PartialChunk[]) => {
    if (!ctx.value) return

    console.log(' ')
    console.log('Handling following chunk data: ', partialChunks)

    currentChunkStartTimeInCtxTime.value = globalStartTime - offset + partialChunks[0].startTime / 1000

    for (const chunk of partialChunks) {
      if (chunk.endTime === MAXIMUM_CHUNK_LENGTH_MS) {
        // Only assign new chunk to found oscillator if last breakpoint of chunk ends
        // MAXIMUM_CHUNK_LENGTH_MS after chunk start.
        // In this case we assume this is part of a longer partial and stitch the parts
        // together seamlessly.
        const oscObj = oscillators.find(el => el.index === chunk.index)
        if (oscObj) {
          setBreakpoints(oscObj.oscillator, oscObj.gain, chunk.breakpoints)
        }
      } else {
        if (!ctx.value) return
        let oscNode = ctx.value.createOscillator()
        const gainNode = ctx.value.createGain()
        oscNode.connect(gainNode)
        gainNode.connect(ctx.value.destination)
        oscNode = setBreakpoints(oscNode, gainNode, chunk.breakpoints)
        oscNode.start(currentChunkStartTimeInCtxTime.value)

        oscNode.stop(globalStartTime - offset + chunk.endTime / 1000)

        oscNode.onended = (event) => {
          const oscObj = oscillators.find(oscObj => oscObj.oscillator === event.target)
          if (oscObj) oscillators.splice(oscillators.indexOf(oscObj), 1)
        }
        oscillators.push({ index: chunk.index, oscillator: oscNode, gain: gainNode })
      }
    }
    waitingForChunks = false
  }

  const setBreakpoints = (oscNode: OscillatorNode, gainNode: GainNode, breakpoints: Breakpoint[]) => {
    for (const bp of breakpoints) {
      oscNode.frequency.setValueAtTime(bp.freq, currentChunkStartTimeInCtxTime.value)
      gainNode.gain.setValueAtTime(bp.amp, currentChunkStartTimeInCtxTime.value)
    }
    return oscNode
  }

  const shouldRequestChunks = () => {
    if (ctx.value) {
      return currentChunkStartTimeInCtxTime.value < ctx.value.currentTime && !waitingForChunks
    } else {
      return false
    }
  }

  const chunksRequested = () => waitingForChunks = true

  const setStartTime = (startTime: number) => {
    // offset = timingSrcPosition.value - player.value.audioContext.currentTime 
    globalStartTime = startTime
  }

  return {
    chunksRequested,
    handleChunkData,
    initialSetup,
    shouldRequestChunks,
    startAudioCtx,
    setStartTime
  }
}
