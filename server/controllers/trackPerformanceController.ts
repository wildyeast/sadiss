import { Request, Response } from 'express'
import { TrackPerformance } from '../models/trackPerformance'
import { SadissPerformance, Track } from '../models'

exports.addTrackToPerformance = async (req: Request, res: Response) => {
  try {
    const { trackId, performanceId } = req.body

    const performance = await SadissPerformance.findById(performanceId)

    if (!performance) {
      return res.status(404).json({ error: 'Performance not found' })
    }

    // If performance is public check if the track is public
    if (performance.isPublic) {
      const track = await Track.findById(trackId)

      if (!track) {
        return res.status(404).json({ error: 'Track not found' })
      }

      if (!track.isPublic) {
        return res.status(400).json({ error: 'Cannot add private track to public performance' })
      }
    }

    // Create a new TrackPerformance record and save it to the database
    const trackPerformance = new TrackPerformance({ track: trackId, performance: performanceId })
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
    const tracks = trackPerformances.map((trackPerformance) => trackPerformance.track)

    // Return the found TrackPerformance records
    res.status(200).json({ tracks })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}
