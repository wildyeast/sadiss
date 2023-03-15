import jwt from 'jsonwebtoken'
import { Request, Response } from 'express'
import { UserDocument } from '../types/types'
import { User } from '../models/user'

exports.login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body
    const user = new User({ username, password })
    await user.save()
    const token = jwt.sign({ id: user._id }, 'secret-key')
    res.json({ token: token })
  } catch (err) {
    res.status(500).json({ message: 'Failed to create user' })
  }
}

exports.register = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body
    const existingUser: UserDocument | null = await User.findOne({ username: username })
    if (existingUser) {
      return res.status(409).json({ message: 'Username already exists' })
    }
    const user = new User({ username, password })
    await user.save()
    res.status(201).json({ message: 'User created successfully' })
  } catch (err) {
    res.status(500).json({ message: 'Failed to create user' })
  }
}
