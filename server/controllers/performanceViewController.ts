import { Request, Response } from 'express'
import { SadissPerformance } from '../models/sadissPerformance'
import { User } from '../models/user'
import { TrackPerformance } from '../models/trackPerformance'
import { Track } from '../models/track'

exports.getPerformanceWithTracks = async (req: Request, res: Response) => {
  try {
    let performance = await SadissPerformance.findById(req.params.id)
    let performanceWithUsernameAndTracks = null
    if (performance) {
      const user = await User.findById(performance.userId, 'username')
      const trackPerformances = await TrackPerformance.find({ performanceId: performance._id }, 'trackId')
      const tracks = await Promise.all(
        trackPerformances.map(async (t) => {
          return await Track.findById(t.trackId, '_id name notes mode waveform ttsRate userId isPublic')
        })
      )

      performanceWithUsernameAndTracks = { _id: performance._id, name: performance.name, username: user?.username, tracks }
    }

    res.json({ performance: performanceWithUsernameAndTracks })
  } catch (err) {
    console.log('Failed getting performance with:', err)
    res.status(500).json({ Error: 'Failed fetching performance.' })
  }
}
