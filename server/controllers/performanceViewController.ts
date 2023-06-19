import { Request, Response } from 'express'
import { SadissPerformance } from '../models/sadissPerformance'
import { TrackPerformance } from '../models/trackPerformance'
import { Track } from '../models/track'

exports.getPerformanceWithTracks = async (req: Request, res: Response) => {
  try {
    const performance = await SadissPerformance.findById(req.params.id, 'name creator tracks')
      .populate('creator', 'username -_id')
      .lean()

    if (!performance) {
      return res.status(404).json({ error: 'Performance not found' })
    }

    let trackPerformances
    trackPerformances = await TrackPerformance.find({ performance: performance._id }, 'track -_id')
      .populate('track', 'name notes mode waveform ttsRate creator isPublic')
      .lean()
    res.json({ performance: { ...performance, tracks: trackPerformances } })
  } catch (err) {
    res.status(500).json({ Error: 'Failed fetching performance.' })
  }
}
