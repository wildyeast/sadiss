import { Ref } from "vue"
import { PartialChunk } from "../types/types"

export function usePlayer () {
  let ctx: AudioContext
  let offset: number
  const oscillators: OscillatorNode[] = []
  let currentChunkStartTimeInCtxTime: number
  let startTime: number

  const setOffset = (globalTime: number) => {
    ctx = new AudioContext()
    offset = globalTime - ctx.currentTime
  }

  const createOscillators = (partialChunk: PartialChunk) => {
    startTime = ctx.currentTime

    currentChunkStartTimeInCtxTime = startTime + partialChunk.startTime / 1000

    let oscNode = ctx.createOscillator()
    const gainNode = ctx.createGain()
    oscNode.connect(gainNode)
    gainNode.connect(ctx.destination)
    oscNode = setBreakpoints(oscNode, partialChunk.breakpoints)
    oscNode.start()
    oscillators.push(oscNode)
  }

  const setNextChunks = (partialChunk: PartialChunk) => {
    currentChunkStartTimeInCtxTime = startTime + partialChunk.startTime / 1000
    const oscNode = oscillators[0] // TODO: Should be PartialChunk index
    setBreakpoints(oscNode, partialChunk.breakpoints)
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
    createOscillators,
    setOffset,
    setNextChunks,
    startRequestChunksInterval
  }

}
