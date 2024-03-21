import { Request, Response } from 'express'
import { TrackPerformance } from '../models/trackPerformance'
import { SadissPerformance, Track } from '../models'
import { Types } from 'mongoose'
import { isValidObjectId } from 'mongoose'
import { unloadTrackFromActivePerformance } from '../services/activePerformanceService'

exports.addTrackToPerformance = async (req: Request, res: Response) => {
  try {
    const { trackId, performanceId } = req.body

    const performance = await SadissPerformance.findById(performanceId)

    if (!performance) {
      return res.status(404).send({ error: 'Performance not found' })
    }

    // If performance is public check if the track is public
    if (performance.isPublic) {
      const track = await Track.findById(trackId)

      if (!track) {
        return res.status(404).send({ error: 'Track not found' })
      }

      if (!track.isPublic) {
        return res.status(400).send({ message: 'Cannot add private track to public performance' })
      }
    }

    const trackPerformances = await TrackPerformance.find({ performance: performanceId })
    const sortOrder = trackPerformances.length + 1

    // Create a new TrackPerformance record and save it to the database
    const trackPerformance = new TrackPerformance({ track: trackId, performance: performanceId, sortOrder })
    trackPerformance.save((err) => {
      if (err) {
        console.error('Error while creating performance', err)
        res.status(500).send(err)
      } else {
        res.status(201).send({ trackPerformance })
      }
    })
  } catch (error) {
    res.status(500).send({ error: 'Server error' })
  }
}

exports.updateTrackPerformanceOrder = async (req: Request, res: Response) => {
  try {
    interface TrackPerformanceIdAndSortOrder {
      trackPerformanceId: Types.ObjectId
      sortOrder: number
    }

    const { trackPerformances }: { trackPerformances: TrackPerformanceIdAndSortOrder[] } = req.body

    // Check if the provided data is valid
    const someInputDataIsInvalid = trackPerformances.some(
      (trackPerformance: TrackPerformanceIdAndSortOrder) =>
        !trackPerformance.trackPerformanceId ||
        !trackPerformance.sortOrder ||
        !isValidObjectId(trackPerformance.trackPerformanceId)
    )
    if (someInputDataIsInvalid) {
      return res.status(400).send({ error: 'Invalid input data' })
    }

    // Update the sortOrder of each trackPerformance
    for (const trackPerformance of trackPerformances) {
      await TrackPerformance.findByIdAndUpdate(trackPerformance.trackPerformanceId, {
        sortOrder: trackPerformance.sortOrder
      })
    }

    res.status(200).send({ message: 'Track performance order updated' })
  } catch (error) {
    res.status(500).send({ error: 'Server error' })
  }
}

exports.deleteTrackFromPerformance = async (req: Request, res: Response) => {
  try {
    const { trackPerformanceId } = req.body

    // Check if the provided data is valid
    if (!trackPerformanceId || !isValidObjectId(trackPerformanceId)) {
      return res.status(400).send({ error: 'Invalid input data' })
    }

    // Soft delete the TrackPerformance record
    const trackPerformance = await TrackPerformance.findById(trackPerformanceId)
    if (!trackPerformance) {
      return res.status(404).send({ error: 'Track performance not found' })
    }

    trackPerformance.deleted = true
    trackPerformance.deletedAt = new Date()
    trackPerformance.deletedBy = req.user!.id
    await trackPerformance.save()

    unloadTrackFromActivePerformance(trackPerformanceId)

    res.status(200).send({ message: 'Track performance deleted' })
  } catch (error) {
    res.status(500).send({ error: 'Server error' })
  }
}

// Currently unused?
// exports.getTracksOfPerformance = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params

//     // Check if the provided ID is valid
//     if (!id) {
//       return res.status(400).json({ error: 'Invalid input data' })
//     }

//     // Find all TrackPerformance records with the provided performanceId
//     const trackPerformances = await TrackPerformance.find({ performanceId: id })

//     // If no TrackPerformance records were found, return an error
//     if (!trackPerformances) {
//       return res.status(404).json({ error: 'No tracks found' })
//     }

//     // Get the tracks of the found TrackPerformance records
//     const tracks = trackPerformances.map((trackPerformance) => trackPerformance.track)

//     // Return the found TrackPerformance records
//     res.status(200).json({ tracks })
//   } catch (error) {
//     res.status(500).json({ error: 'Server error' })
//   }
// }
