import passport from 'passport'
import { Strategy as LocalStrategy } from 'passport-local'
import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'
import { User } from './models/user'
import * as dotenv from 'dotenv'
import { UserDocument } from './types/types'

const bcrypt = require('bcryptjs')

// Load .env
dotenv.config()

passport.use(
  new LocalStrategy(async function (username, password, done) {
    try {
      const user: Express.User | null = await User.findOne({ username: username })
      if (!user) {
        return done(null, false)
      }

      const match = await bcrypt.compare(password, user.password)
      if (!match) {
        return done(null, false)
      }

      return done(null, user)
    } catch (err) {
      return done(err)
    }
  })
)

// TODO: Return more specific error messages
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.jwt
  if (!token) return res.sendStatus(401)

  jwt.verify(token, process.env.JWT_SECRET!, (err: any, user: any) => {
    if (err) return res.sendStatus(403)
    req.user = user
    next()
  })
}

export { passport, authenticateToken }
