import { ref } from "vue"
import { PartialChunk, OscillatorObject, Breakpoint } from "../types/types"

export function usePlayer () {
  const ctx = ref<AudioContext>()
  const oscillators: OscillatorObject[] = []
  const currentChunkStartTimeInCtxTime = ref()
  let startTime: number
  const waitingForChunks = ref(false)

  const initialSetup = (partialChunks: PartialChunk[]) => {
    if (!ctx.value) return
    startTime = ctx.value.currentTime
    handleChunkData(partialChunks)
  }

  const startAudioCtx = () => {
    console.log('Starting ctx.')
    ctx.value = new AudioContext()
  }

  const handleChunkData = (partialChunks: PartialChunk[]) => {
    if (!ctx.value) return

    console.log(' ')
    console.log('Handling following chunk data: ', partialChunks)

    currentChunkStartTimeInCtxTime.value = startTime + partialChunks[0].startTime / 1000

    for (const chunk of partialChunks) {
      const oscObj = oscillators.find(el => el.index === chunk.index)
      if (oscObj && chunk.endTime === 999) {
        setBreakpoints(oscObj.oscillator, oscObj.gain, chunk.breakpoints)
      } else {
        if (!ctx.value) return
        let oscNode = ctx.value.createOscillator()
        const gainNode = ctx.value.createGain()
        oscNode.connect(gainNode)
        gainNode.connect(ctx.value.destination)
        oscNode = setBreakpoints(oscNode, gainNode, chunk.breakpoints)
        oscNode.start(currentChunkStartTimeInCtxTime.value)

        oscNode.stop(startTime + chunk.partialEndTime / 1000)

        oscNode.onended = (event) => {
          const oscObj = oscillators.find(oscObj => oscObj.oscillator === event.target)
          if (oscObj) oscillators.splice(oscillators.indexOf(oscObj), 1)
        }
        oscillators.push({ index: chunk.index, oscillator: oscNode, gain: gainNode })
      }
    }
    waitingForChunks.value = false
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
      return currentChunkStartTimeInCtxTime.value < ctx.value.currentTime && !waitingForChunks.value
    } else {
      return false
    }
  }

  const chunksRequested = () => {
    if (!ctx.value) return
    waitingForChunks.value = true
  }

  return {
    initialSetup,
    startAudioCtx,
    handleChunkData,
    shouldRequestChunks,
    chunksRequested
  }
}
