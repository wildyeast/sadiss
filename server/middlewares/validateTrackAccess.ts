import { Request, Response, NextFunction } from 'express'
import { Track } from '../models/track'

export const validateTrackAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const trackId = req.body.trackId
    const track = await Track.findById(trackId)

    if (!track) {
      return res.status(404).json({ error: 'Track not found' })
    }

    if (!track.isPublic && track.userId !== req.user!.id) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    next()
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}
