import { PartialChunk } from './PartialChunk'
import { TtsInstructions } from './TtsInstructions'

export interface Frame {
  partials: PartialChunk[]
  ttsInstructions: TtsInstructions
}
