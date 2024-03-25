import jwt from 'jsonwebtoken'
import { Request, Response } from 'express'
import { User } from '../models/user'
import { env } from 'process'

const bcrypt = require('bcryptjs')

exports.login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).send({ message: 'Please provide an email and password' })
    }

    // Find user by email
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).send({ message: 'Invalid email or password' })
    }

    // Compare hashed password
    const isPasswordMatched = await bcrypt.compare(password, user.password)
    if (!isPasswordMatched) {
      return res.status(401).send({ message: 'Invalid email or password' })
    }

    // Generate and send JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!)

    const secureOption = process.env.NODE_ENV === 'production'

    // Set token as an HTTP-only cookie
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: secureOption,
      //@ts-ignore 'Strict' might be correct here, not 'strict'
      sameSite: 'Strict',
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24) // 1 day
    })

    res.json({ message: 'Login successful' })
  } catch (err) {
    res.status(500).send({ message: 'Failed to login' })
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
