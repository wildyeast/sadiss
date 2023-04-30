import { Request, Response, NextFunction } from 'express'
import { SadissPerformance } from '../models/sadissPerformance'

export const validatePerformanceAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const performanceId = req.params.performanceId
    const performance = await SadissPerformance.findById(performanceId)

    if (!performance) {
      return res.status(404).json({ error: 'Performance not found' })
    }

    if (performance.userId !== req.user!.id) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    next()
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
}
