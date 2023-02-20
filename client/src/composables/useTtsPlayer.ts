import { setUncaughtExceptionCaptureCallback } from "process"
import { ref, computed, Ref } from 'vue'
import { ClientTtsInstruction } from "../types/types"

export function useTtsPlayer () {

  let globalTime: Ref<number>
  let globalStartTime: number
  let ttsInstruction: ClientTtsInstruction

  let currentInstructionStartTime: number

  const speak = (ttsInstruction: ClientTtsInstruction) => {
    ttsInstruction = ttsInstruction
    currentInstructionStartTime = globalStartTime + ttsInstruction.startTime
    const utterance = new SpeechSynthesisUtterance(ttsInstruction.text)
    speechSynthesis.speak(utterance)
  }

  let waitingForTtsInstructions = false
  const shouldRequestTts = computed(() => currentInstructionStartTime < globalTime.value && !waitingForTtsInstructions)
  const ttsRequested = () => waitingForTtsInstructions = true

  // TODO: Find a better solution for this.
  const initializeTtsPlayer = (time: Ref<number>) => globalTime = time

  const setStartTime = (startTime: number) => globalStartTime = startTime

  return {
    initializeTtsPlayer,
    setStartTime,
    shouldRequestTts,
    ttsRequested
  }
}
