import { Document } from 'mongoose'

export interface UserDocument extends Document {
  username: string
  password: string
  id: string
  email: string
}
