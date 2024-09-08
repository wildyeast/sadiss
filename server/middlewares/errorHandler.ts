import { Request, Response, NextFunction } from 'express'
import { InvalidInputError, NotFoundError, ProcessingError } from '../errors'

export const errorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof InvalidInputError) {
    return res.status(400).json({ message: error.message })
  } else if (error instanceof NotFoundError) {
    return res.status(404).json({ message: error.message })
  } else if (error instanceof ProcessingError) {
    return res.status(500).json({ message: error.message })
  } else {
    console.error('Unexpected error:', error)
    return res.status(500).json({ message: 'An unexpected error occurred.' })
  }
}
