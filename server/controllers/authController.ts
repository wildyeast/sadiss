import jwt from 'jsonwebtoken'
import { Request, Response } from 'express'
import { User } from '../models/user'
import { env } from 'process'
import { authenticateUser, generateToken } from '../services/authService'
import bcrypt from 'bcryptjs'
import { NotFoundError } from '../errors'

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    const user = await authenticateUser(email, password)

    const token = generateToken(user._id.toString())

    const secureOption = process.env.NODE_ENV === 'production'

    res.cookie('jwt', token, {
      httpOnly: true,
      secure: secureOption,
      //@ts-ignore 'Strict' might be correct here, not 'strict'
      sameSite: 'Strict',
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24) // 1 day
    })

    res.json({ message: 'Login successful' })
  } catch (err) {
    if (err instanceof NotFoundError) {
      return res.status(404).json({ message: 'Invalid email or password' })
    } else {
      res.status(500)
    }
  }
}

exports.register = async (req: Request, res: Response) => {
  try {
    const { username, password, email } = req.body
    const existingUser = await User.findOne({ $or: [{ username: username }, { email: email }] })
    if (existingUser) {
      return res.status(409).send({ message: 'Username already exists' })
    }
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = new User({ username, password: hashedPassword, email })
    await user.save()
    if (env.NODE_ENV === 'test') {
      return res.status(201).send(user)
    } else {
      res.status(201).send({ message: 'User created successfully' })
    }
  } catch (err) {
    res.status(500).send({ message: 'Failed to create user' })
  }
}

exports.isLoggedIn = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.jwt
    if (!token) return res.send({ message: 'No token' }).status(401)

    jwt.verify(token, process.env.JWT_SECRET!, async (err: any, user: any) => {
      if (err) return res.sendStatus(403)
      req.user = user

      const userDocument = await User.findById(req.user!.id, 'username -_id')

      res.json({ message: 'Logged in', user: userDocument })
    })
  } catch (err) {
    res.status(500).json({ message: 'Failed to check login status' })
  }
}

exports.logout = async (req: Request, res: Response) => {
  try {
    res.clearCookie('jwt')
    res.json({ message: 'Logged out' })
  } catch (err) {
    res.status(500).json({ message: 'Failed to logout' })
  }
}
