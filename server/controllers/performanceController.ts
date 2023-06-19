import { Response, Request } from 'express'
import { isValidObjectId } from 'mongoose'
import { SadissPerformance } from '../models/sadissPerformance'
import { User } from '../models/user'

// Get all performances that are public or owned by the user
exports.getPerformances = async (req: Request, res: Response) => {
  try {
    // Get all performances that are public or owned by the user
    const performances = await SadissPerformance.find(
      { $or: [{ isPublic: true }, { creator: req.user!.id }] },
      '_id name creator isPublic'
    ).populate('creator', 'username')

    res.json({ performances })
  } catch (err) {
    res.status(500).json({ Error: 'Failed fetching performances.' })
  }
}

exports.getPerformance = async (req: Request, res: Response) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid performance ID' })
    }

    let performance = await SadissPerformance.findById(req.params.id)

    if (!performance) {
      return res.status(404).json({ error: 'Performance not found' })
    }

    let performanceWithUsername
    const user = await User.findById(performance.creator, 'username').lean()
    performanceWithUsername = {
      _id: performance._id,
      name: performance.name,
      username: user?.username,
      isPublic: performance.isPublic
    }

    res.json({ performance: performanceWithUsername })
  } catch (err) {
    res.status(500).json({ Error: 'Failed fetching performance.' })
  }
}

exports.createPerformance = async (req: Request, res: Response) => {
  try {
    const { name, isPublic } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Invalid performance data' })
    }

    // Save new performance to database
    const performance = new SadissPerformance({ name, isPublic: !!isPublic, creator: req.user!.id })
    performance.save((err) => {
      if (err) {
        res.status(500).send(err)
      } else {
        res.status(201).json(performance)
      }
    })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}

exports.delete_performance = async (req: Request, res: Response) => {
  try {
    const performance = await SadissPerformance.findById(req.params.id)

    if (!performance) {
      return res.status(404).json({ error: 'Performance not found' })
    }

    // Check if user owns performance
    if (performance.creator !== req.user!.id) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Delete performance
    await performance.remove()

    res.status(200).json({ message: 'Performance deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}
