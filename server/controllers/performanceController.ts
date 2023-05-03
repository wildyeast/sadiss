import { Response, Request } from 'express'
import { SadissPerformance } from '../models/sadissPerformance'

// Get all performances that are public or owned by the user
exports.getPerformances = async (req: Request, res: Response) => {
  try {
    // Get all performances that are public or owned by the user
    const allPerformances = await SadissPerformance.find({ $or: [{ isPublic: true }, { userId: req.user!.id }] }, '_id name')
    res.json({ performances: allPerformances })
  } catch (err) {
    console.log('Failed getting performances with:', err)
    res.status(500).json({ Error: 'Failed fetching performances.' })
  }
}

exports.create_performance = async (req: Request, res: Response) => {
  try {
    const { name, isPublic } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Invalid performance data' })
    }

    // Save new performance to database
    const performance = new SadissPerformance({ name, isPublic: !!isPublic, userId: req.user!.id })
    performance.save((err) => {
      if (err) {
        console.error('Error while creating performance', err)
        res.status(500).send(err)
      } else {
        res.status(201).json({ performance })
      }
    })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}
