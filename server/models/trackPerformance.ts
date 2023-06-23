import { Schema, model } from 'mongoose'
import { TrackPerformanceDocument } from '../types/types'

export const trackPerformanceSchema = new Schema<TrackPerformanceDocument>({
  track: { type: Schema.Types.ObjectId, ref: 'Track', required: true },
  performance: { type: Schema.Types.ObjectId, ref: 'SadissPerformance', required: true }
})
trackPerformanceSchema.set('timestamps', true)

export const TrackPerformance = model<TrackPerformanceDocument>('TrackPerformance', trackPerformanceSchema)
