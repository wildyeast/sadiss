import { NextFunction, Request, Response } from 'express'

export const validateLoginInput = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide an email and password' })
  }
  next()
}
