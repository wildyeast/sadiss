import { Schema, model } from 'mongoose'
import { TrackPerformanceDocument } from '../types'

export const trackPerformanceSchema = new Schema<TrackPerformanceDocument>({
  track: { type: Schema.Types.ObjectId, ref: 'Track', required: true },
  performance: { type: Schema.Types.ObjectId, ref: 'SadissPerformance', required: true },
  sortOrder: { type: Number, required: true },
  startTime: { type: Number, required: true },
  deleted: Boolean,
  deletedAt: Date,
  deletedBy: { type: Schema.Types.ObjectId, ref: 'User' }
})
trackPerformanceSchema.set('timestamps', true)

export const TrackPerformance = model<TrackPerformanceDocument>('TrackPerformance', trackPerformanceSchema)
