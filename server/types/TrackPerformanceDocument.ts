import { Document, Types } from 'mongoose'
import { TrackDocument } from './TrackDocument'
import { SadissPerformanceDocument } from './SadissPerformanceDocument'

export interface TrackPerformanceDocument extends Document {
  _id: string
  track: TrackDocument
  performance: SadissPerformanceDocument
  sortOrder: number
  startTime: number
  deleted: boolean
  deletedAt: Date
  deletedBy: Types.ObjectId
}
