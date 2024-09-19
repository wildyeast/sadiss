import { Track } from "."

export default interface SadissPerformance {
  _id: string
  name: string
  creator: { _id: string; username: string }
  isPublic: boolean
  tracks: Track[]
  trackCount: number
}
