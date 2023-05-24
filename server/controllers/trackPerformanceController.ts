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

exports.getTracksOfPerformance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // Check if the provided ID is valid
    if (!id) {
      return res.status(400).json({ error: 'Invalid input data' })
    }

    // Find all TrackPerformance records with the provided performanceId
    const trackPerformances = await TrackPerformance.find({ performanceId: id })

    // If no TrackPerformance records were found, return an error
    if (!trackPerformances) {
      return res.status(404).json({ error: 'No tracks found' })
    }

    // Get the tracks of the found TrackPerformance records
    const tracks = trackPerformances.map((trackPerformance) => trackPerformance.trackId)

    // Return the found TrackPerformance records
    res.status(200).json({ tracks })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}
