import { Schema, model } from 'mongoose'
import { TrackDocument, TTSFileObject } from '../types'

export const trackSchema = new Schema<TrackDocument>({
  name: { type: String, required: true },
  chunks: String,
  chunkFileName: String,
  trackLengthInChunks: Number,
  partialsCount: Number,
  mode: { type: String, required: true },
  notes: String,
  ttsLangs: Array<String>,
  waveform: String,
  ttsRate: String,
  partialFile: Object,
  ttsFiles: Array<TTSFileObject>,
  isPublic: { type: Boolean, required: true },
  creator: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  deleted: Boolean,
  deletedAt: Date,
  deletedBy: { type: Schema.Types.ObjectId, ref: 'User' }
})
trackSchema.set('timestamps', true)

export const Track = model<TrackDocument>('Track', trackSchema)
