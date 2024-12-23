import { Document, Types } from 'mongoose'

export interface SadissPerformanceDocument extends Document {
  name: string
  creator: Types.ObjectId
  isPublic: boolean
  deleted: boolean
  deletedAt: Date
  deletedBy: Types.ObjectId
}
