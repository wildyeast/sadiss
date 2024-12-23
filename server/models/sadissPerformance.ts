import { Schema, model } from 'mongoose'
import { SadissPerformanceDocument } from '../types'

export const sadissPerformanceSchema = new Schema<SadissPerformanceDocument>({
  name: { type: String, required: true },
  creator: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  isPublic: { type: Boolean, required: true },
  deleted: Boolean,
  deletedAt: Date,
  deletedBy: { type: Schema.Types.ObjectId, ref: 'User' }
})
sadissPerformanceSchema.set('timestamps', true)

export const SadissPerformance = model<SadissPerformanceDocument>('SadissPerformance', sadissPerformanceSchema)
