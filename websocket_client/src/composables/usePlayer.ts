import { Ref } from "vue"
import { PartialChunk, OscillatorObject } from "../types/types"

export function usePlayer () {
  let ctx: AudioContext
  const oscillators: OscillatorObject[] = []
  let currentChunkStartTimeInCtxTime: number
  let startTime: number

  const initialSetup = (partialChunks: PartialChunk[]) => {
    ctx = new AudioContext()
    startTime = ctx.currentTime
    currentChunkStartTimeInCtxTime = startTime + partialChunks[0].startTime / 1000
    for (const chunk of partialChunks) {
      createOscillator(chunk)
    }
    console.log(oscillators)
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

  const setNextChunks = (partialChunks: PartialChunk[]) => {
    currentChunkStartTimeInCtxTime = startTime + partialChunks[0].startTime / 1000
    for (const chunk of partialChunks) {
      console.log('Setting chunk: ', chunk)
      const oscObj = oscillators.find(el => el.index === chunk.index)
      if (oscObj) {
        setBreakpoints(oscObj.oscillator, chunk.breakpoints)
      }
    }
    console.log(' ')
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
    setNextChunks,
    startRequestChunksInterval
  }

}
