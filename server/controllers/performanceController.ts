import { Response, Request } from 'express'
import { SadissPerformance } from '../models/sadissPerformance'
import { User } from '../models/user'

// Get all performances that are public or owned by the user
exports.getPerformances = async (req: Request, res: Response) => {
  try {
    // Get all performances that are public or owned by the user
    const performances = await SadissPerformance.find({ $or: [{ isPublic: true }, { userId: req.user!.id }] }, '_id name userId')

    // Map performances to include username instead of user ID
    const performancesWithUsername = await Promise.all(
      performances.map(async (performance) => {
        const user = await User.findById(performance.userId, 'username')
        return { _id: performance._id, name: performance.name, username: user?.username }
      })
    )

    res.json({ performances: performancesWithUsername })
  } catch (err) {
    console.log('Failed getting performances with:', err)
    res.status(500).json({ Error: 'Failed fetching performances.' })
  }
}

exports.getPerformance = async (req: Request, res: Response) => {
  try {
    let performance = await SadissPerformance.findById(req.params.id)
    let performanceWithUsername = null
    if (performance) {
      const user = await User.findById(performance.userId, 'username')
      performanceWithUsername = { _id: performance._id, name: performance.name, username: user?.username }
    }

    res.json({ performance: performanceWithUsername })
  } catch (err) {
    console.log('Failed getting performance with:', err)
    res.status(500).json({ Error: 'Failed fetching performance.' })
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

exports.delete_performance = async (req: Request, res: Response) => {
  try {
    const performance = await SadissPerformance.findById(req.params.id)

    if (!performance) {
      return res.status(404).json({ error: 'Performance not found' })
    }

    // Check if user owns performance
    if (performance.userId !== req.user!.id) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Delete performance
    await performance.remove()

    res.status(200).json({ message: 'Performance deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}
