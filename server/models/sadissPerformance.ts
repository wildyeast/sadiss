import { Schema, model } from 'mongoose'
import { SadissPerformanceDocument } from '../types/types'

export const sadissPerformanceSchema = new Schema<SadissPerformanceDocument>({
  name: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  isPublic: { type: Boolean, required: true }
})
sadissPerformanceSchema.set('timestamps', true)

export const SadissPerformance = model<SadissPerformanceDocument>('SadissPerformance', sadissPerformanceSchema)
