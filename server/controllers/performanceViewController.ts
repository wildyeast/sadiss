import { Request, Response } from 'express'
import { SadissPerformance } from '../models/sadissPerformance'
import { TrackPerformance } from '../models/trackPerformance'

exports.getPerformanceWithTracks = async (req: Request, res: Response) => {
  try {
    const performance = await SadissPerformance.findById(req.params.id, 'name creator tracks')
      .populate('creator', 'username -_id')
      .lean()

    if (!performance) {
      return res.status(404).json({ error: 'Performance not found' })
    }

    const trackPerformances = await TrackPerformance.find({ performance: performance._id }, 'track -_id')
      .populate('track', 'name notes mode waveform ttsRate creator isPublic')
      .lean()

    const tracks = trackPerformances.map((trackPerformance) => trackPerformance.track)

    res.json({ performance: { ...performance, tracks } })
  } catch (err) {
    res.status(500).json({ Error: 'Failed fetching performance.' })
  }
}
