import { Ref } from "vue"
import { PartialChunk, OscillatorObject, Breakpoint } from "../types/types"

export function usePlayer () {
  let ctx: AudioContext
  const oscillators: OscillatorObject[] = []
  let currentChunkStartTimeInCtxTime: number
  let startTime: number
  let waitingForChunks = false

  const initialSetup = (partialChunks: PartialChunk[]) => {
    ctx = new AudioContext()
    startTime = ctx.currentTime
    handleChunkData(partialChunks)
  }

  const handleChunkData = (partialChunks: PartialChunk[]) => {

    console.log('Handling following chunk data: ', partialChunks)

    waitingForChunks = false
    currentChunkStartTimeInCtxTime = startTime + partialChunks[0].startTime / 1000
    for (const chunk of partialChunks) {
      const oscObj = oscillators.find(el => el.index === chunk.index)
      if (oscObj) {
        setBreakpoints(oscObj.oscillator, chunk.breakpoints)
      } else {
        let oscNode = ctx.createOscillator()
        const gainNode = ctx.createGain()
        oscNode.connect(gainNode)
        gainNode.connect(ctx.destination)
        oscNode = setBreakpoints(oscNode, chunk.breakpoints)
        oscNode.start(currentChunkStartTimeInCtxTime)
        oscillators.push({ index: chunk.index, oscillator: oscNode })
      }
    }
  }

  const setBreakpoints = (oscNode: OscillatorNode, breakpoints: Breakpoint[]) => {
    for (const bp of breakpoints) {
      oscNode.frequency.setValueAtTime(bp.freq, startTime + bp.time / 1000)
    }
    return oscNode
  }

  const startRequestChunksInterval = (ws: Ref<WebSocket | undefined>) => {
    setInterval(() => {
      if (currentChunkStartTimeInCtxTime <= ctx.currentTime && !waitingForChunks) {
        ws.value?.send(JSON.stringify('chunkRequest'))
        waitingForChunks = true
      }
    }, 10) // TODO: Intervals can probably be longer.
  }

  return {
    initialSetup,
    startRequestChunksInterval,
    handleChunkData
  }

}
