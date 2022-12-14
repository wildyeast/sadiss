import { Ref } from "vue"
import { PartialChunk, OscillatorObject } from "../types/types"

export function usePlayer () {
  let ctx: AudioContext
  let offset: number
  const oscillators: OscillatorObject[] = []
  let currentChunkStartTimeInCtxTime: number
  let startTime: number

  const setOffset = (globalTime: number) => {
    ctx = new AudioContext()
    offset = globalTime - ctx.currentTime
    console.log('Offset set to: ', offset)
  }

  const initialSetup = (partialChunk: PartialChunk) => {
    startTime = ctx.currentTime
    currentChunkStartTimeInCtxTime = startTime + partialChunk.startTime / 1000
    createOscillator(partialChunk)
  }

  const createOscillator = (partialChunk: PartialChunk) => {
    let oscNode = ctx.createOscillator()
    const gainNode = ctx.createGain()
    oscNode.connect(gainNode)
    gainNode.connect(ctx.destination)
    oscNode = setBreakpoints(oscNode, partialChunk.breakpoints)
    oscNode.start()
    oscillators.push({ index: partialChunk.index, oscillator: oscNode })
  }

  const setNextChunks = (partialChunk: PartialChunk) => {
    currentChunkStartTimeInCtxTime = startTime + partialChunk.startTime / 1000
    const oscObj = oscillators.find(el => el.index === partialChunk.index)
    if (oscObj) {
      setBreakpoints(oscObj.oscillator, partialChunk.breakpoints)
    }
  }

  const startRequestChunksInterval = (ws: Ref<WebSocket | undefined>) => {
    setInterval(() => {
      if (currentChunkStartTimeInCtxTime <= ctx.currentTime) {
        ws.value?.send(JSON.stringify('chunkRequest'))
      }
    }, 100)
  }

  const setBreakpoints = (oscNode: OscillatorNode, breakpoints: { time: number, freq: number, amp: number }[]) => {
    for (const bp of breakpoints) {
      oscNode.frequency.setValueAtTime(bp.freq, startTime + bp.time / 1000)
    }
    return oscNode
  }

  return {
    initialSetup,
    setOffset,
    setNextChunks,
    startRequestChunksInterval
  }

}
