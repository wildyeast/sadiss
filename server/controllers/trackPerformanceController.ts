import { Request, Response } from 'express'
import { TrackPerformance } from '../models/trackPerformance'

exports.add_track_to_performance = async (req: Request, res: Response) => {
  try {
    const { trackId, performanceId } = req.body

    // Check if the provided IDs are valid
    if (!trackId || !performanceId) {
      return res.status(400).json({ error: 'Invalid input data' })
    }

    // Create a new TrackPerformance record and save it to the database
    const trackPerformance = new TrackPerformance({ trackId, performanceId })
    trackPerformance.save((err) => {
      if (err) {
        console.error('Error while creating performance', err)
        res.status(500).send(err)
      } else {
        res.status(201).json({ trackPerformance })
      }
    })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}
