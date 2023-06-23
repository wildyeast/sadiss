import { Schema, model } from 'mongoose'
import { UserDocument } from '../types/types'

export const userSchema = new Schema<UserDocument>({
  username: { type: String, required: true },
  password: { type: String, required: true },
  email: { type: String, required: true }
})

export const User = model<UserDocument>('User', userSchema)
