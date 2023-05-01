import jwt from 'jsonwebtoken'
import { Request, Response } from 'express'
import { UserDocument } from '../types/types'
import { User } from '../models/user'
import * as dotenv from 'dotenv'

const bcrypt = require('bcryptjs')

// Load .env
dotenv.config()

exports.login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body

    // Find user by username
    const user = await User.findOne({ username })
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' })
    }

    // Compare hashed password
    const isPasswordMatched = await bcrypt.compare(password, user.password)
    if (!isPasswordMatched) {
      return res.status(401).json({ message: 'Invalid username or password' })
    }

    // Generate and send JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!)
    res.json({ token: token })
  } catch (err) {
    res.status(500).json({ message: 'Failed to login' })
  }
}

exports.register = async (req: Request, res: Response) => {
  try {
    const { username, password, email } = req.body
    const existingUser = await User.findOne({ $or: [{ username: username }, { email: email }] })
    if (existingUser) {
      return res.status(409).json({ message: 'Username already exists' })
    }
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = new User({ username, password: hashedPassword, email })
    await user.save()
    res.status(201).json({ message: 'User created successfully' })
  } catch (err) {
    res.status(500).json({ message: 'Failed to create user' })
  }
}
