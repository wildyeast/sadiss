import { Request, Response, NextFunction } from 'express'
import { Track } from '../models/track'
import { isValidObjectId } from 'mongoose'

export const validateTrackAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const trackId = req.body.trackId

    if (!trackId || !isValidObjectId(trackId)) {
      return res.status(400).json({ error: 'Invalid input data' })
    }

    const track = await Track.findById(trackId).lean()

    if (!track) {
      return res.status(404).json({ error: 'Track not found' })
    }

    if (!track.isPublic && track.creator.toString() !== req.user!.id.toString()) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    next()
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}
