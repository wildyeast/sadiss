import express from 'express'
import { SadissPerformance } from '../models/sadissPerformance'

exports.get_performances = async (req: express.Request, res: express.Response) => {
  res.json([
    {
      date: new Date('Sat Apr 15 2023 00:00:00 GMT-0400 (Eastern Daylight Time)'),
      name: 'Naming Names',
      location: 'Beta-test for a piece for no audience by Simon Lee, Eve Sussman, Volkmar Klien. Crown Heights, Brooklyn.',
      url: 'https://sadiss.net'
    }
  ])
}

exports.create_performance = async (req: express.Request, res: express.Response) => {
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

    // Return success response with saved performance data
  } catch (error) {
    res.status(500).json({ error })
  }
}
